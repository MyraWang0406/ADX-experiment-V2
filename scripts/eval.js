#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// 评测配置
const CASES_DIR = path.join(__dirname, '../cases')
const EXPECTED_DIR = path.join(__dirname, '../expected')

// 深拷贝对象
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// 获取嵌套对象的值（支持路径如 "a.b[0].c"）
function getValueByPath(obj, pathStr) {
  const parts = pathStr.split('.')
  let current = obj
  
  for (const part of parts) {
    if (part.includes('[')) {
      const [key, indexStr] = part.split('[')
      const index = parseInt(indexStr.replace(']', ''))
      if (current[key] && Array.isArray(current[key]) && current[key][index] !== undefined) {
        current = current[key][index]
      } else {
        return undefined
      }
    } else {
      if (current[part] !== undefined) {
        current = current[part]
      } else {
        return undefined
      }
    }
  }
  
  return current
}

// 验证 schema：检查必需字段
function validateSchema(actual, expected) {
  const errors = []
  
  // 检查必需字段
  const requiredFields = ['conclusion', 'evidence_paths', 'recommended_actions']
  for (const field of requiredFields) {
    if (!(field in actual)) {
      errors.push(`缺少必需字段: ${field}`)
    }
  }
  
  // 检查 conclusion 类型
  if (actual.conclusion !== undefined && typeof actual.conclusion !== 'string') {
    errors.push(`conclusion 必须是字符串，实际类型: ${typeof actual.conclusion}`)
  }
  
  // 检查 evidence_paths 类型
  if (actual.evidence_paths !== undefined && !Array.isArray(actual.evidence_paths)) {
    errors.push(`evidence_paths 必须是数组，实际类型: ${typeof actual.evidence_paths}`)
  }
  
  // 检查 recommended_actions 类型和结构
  if (actual.recommended_actions !== undefined) {
    if (!Array.isArray(actual.recommended_actions)) {
      errors.push(`recommended_actions 必须是数组，实际类型: ${typeof actual.recommended_actions}`)
    } else {
      actual.recommended_actions.forEach((action, idx) => {
        if (typeof action !== 'object' || action === null) {
          errors.push(`recommended_actions[${idx}] 必须是对象`)
        } else {
          const actionRequiredFields = ['action', 'owner', 'validation']
          for (const field of actionRequiredFields) {
            if (!(field in action)) {
              errors.push(`recommended_actions[${idx}] 缺少必需字段: ${field}`)
            }
          }
        }
      })
    }
  }
  
  return errors
}

// 比较字段值（支持路径）
function compareFields(actual, expected, caseData) {
  const differences = []
  
  // 比较 conclusion（允许部分匹配，但必须包含关键信息）
  if (expected.conclusion && actual.conclusion) {
    // 简单检查：结论长度应该合理（至少50字符）
    if (actual.conclusion.length < 50) {
      differences.push({
        path: 'conclusion',
        expected: '至少50字符',
        actual: `仅${actual.conclusion.length}字符`,
        message: '结论过短，可能缺少关键信息'
      })
    }
  }
  
  // 比较 evidence_paths：检查路径是否存在且可访问
  if (expected.evidence_paths && actual.evidence_paths) {
    const expectedPaths = new Set(expected.evidence_paths)
    const actualPaths = new Set(actual.evidence_paths)
    
    // 检查缺失的路径
    for (const pathStr of expectedPaths) {
      if (!actualPaths.has(pathStr)) {
        differences.push({
          path: `evidence_paths[${pathStr}]`,
          expected: '存在',
          actual: '缺失',
          message: `缺少证据路径: ${pathStr}`
        })
      } else {
        // 验证路径是否可访问
        const value = getValueByPath(caseData, pathStr)
        if (value === undefined) {
          differences.push({
            path: `evidence_paths[${pathStr}]`,
            expected: '路径可访问',
            actual: '路径不可访问',
            message: `证据路径无效: ${pathStr}`
          })
        }
      }
    }
    
    // 检查额外的路径（可选，仅警告）
    for (const pathStr of actualPaths) {
      if (!expectedPaths.has(pathStr)) {
        const value = getValueByPath(caseData, pathStr)
        if (value === undefined) {
          differences.push({
            path: `evidence_paths[${pathStr}]`,
            expected: '路径可访问',
            actual: '路径不可访问',
            message: `额外证据路径无效: ${pathStr}`,
            severity: 'warning'
          })
        }
      }
    }
  }
  
  // 比较 recommended_actions：检查数量和关键字段
  if (expected.recommended_actions && actual.recommended_actions) {
    if (actual.recommended_actions.length < expected.recommended_actions.length) {
      differences.push({
        path: 'recommended_actions.length',
        expected: `至少${expected.recommended_actions.length}条`,
        actual: `${actual.recommended_actions.length}条`,
        message: '推荐动作数量不足'
      })
    }
    
    // 检查每条动作的关键字段
    expected.recommended_actions.forEach((expectedAction, idx) => {
      if (idx < actual.recommended_actions.length) {
        const actualAction = actual.recommended_actions[idx]
        
        // 检查 action 字段（允许部分匹配）
        if (expectedAction.action && actualAction.action) {
          if (!actualAction.action.includes(expectedAction.action.split(' ')[0])) {
            differences.push({
              path: `recommended_actions[${idx}].action`,
              expected: `包含"${expectedAction.action.split(' ')[0]}"`,
              actual: actualAction.action,
              message: '动作描述不匹配'
            })
          }
        }
        
        // 检查 owner 字段（必须完全匹配）
        if (expectedAction.owner && actualAction.owner !== expectedAction.owner) {
          differences.push({
            path: `recommended_actions[${idx}].owner`,
            expected: expectedAction.owner,
            actual: actualAction.owner,
            message: '负责人不匹配'
          })
        }
        
        // 检查 validation 字段（允许部分匹配）
        if (expectedAction.validation && actualAction.validation) {
          if (actualAction.validation.length < 10) {
            differences.push({
              path: `recommended_actions[${idx}].validation`,
              expected: '至少10字符',
              actual: `仅${actualAction.validation.length}字符`,
              message: '验证方法描述过短'
            })
          }
        }
      }
    })
  }
  
  return differences
}

// 运行单个 case 的评测
function evaluateCase(caseFile, expectedFile) {
  const caseName = path.basename(caseFile, '.json')
  
  try {
    // 读取输入和期望输出
    const caseData = JSON.parse(fs.readFileSync(caseFile, 'utf8'))
    const expected = JSON.parse(fs.readFileSync(expectedFile, 'utf8'))
    
    // 注意：这里假设实际输出已经生成
    // 在实际使用中，需要调用 AI 复盘函数生成 actual
    // 这里我们模拟一个占位符，实际使用时需要替换为真实的 AI 输出
    const actualFile = path.join(__dirname, '../actual', `${caseName}.json`)
    let actual
    
    if (fs.existsSync(actualFile)) {
      actual = JSON.parse(fs.readFileSync(actualFile, 'utf8'))
    } else {
      console.log(`⚠️  ${caseName}: 未找到实际输出文件，跳过评测`)
      return { caseName, passed: false, skipped: true, reason: '未找到实际输出文件' }
    }
    
    // Schema 验证
    const schemaErrors = validateSchema(actual, expected)
    if (schemaErrors.length > 0) {
      return {
        caseName,
        passed: false,
        schemaErrors,
        differences: [],
        reason: 'Schema 验证失败'
      }
    }
    
    // 字段比较
    const differences = compareFields(actual, expected, caseData)
    
    const criticalErrors = differences.filter(d => d.severity !== 'warning')
    const passed = criticalErrors.length === 0
    
    return {
      caseName,
      passed,
      schemaErrors: [],
      differences,
      warnings: differences.filter(d => d.severity === 'warning').length
    }
  } catch (error) {
    return {
      caseName,
      passed: false,
      error: error.message,
      reason: '评测过程出错'
    }
  }
}

// 主函数
function main() {
  console.log('🚀 开始评测 AI 自动复盘输出...\n')
  
  // 读取所有 case 文件
  const caseFiles = fs.readdirSync(CASES_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(CASES_DIR, f))
    .sort()
  
  if (caseFiles.length === 0) {
    console.error('❌ 未找到任何 case 文件')
    process.exit(1)
  }
  
  const results = []
  
  for (const caseFile of caseFiles) {
    const caseName = path.basename(caseFile, '.json')
    const expectedFile = path.join(EXPECTED_DIR, `${caseName}.json`)
    
    if (!fs.existsSync(expectedFile)) {
      console.log(`⚠️  ${caseName}: 未找到期望输出文件，跳过`)
      continue
    }
    
    const result = evaluateCase(caseFile, expectedFile)
    results.push(result)
    
    // 输出结果
    if (result.skipped) {
      console.log(`⏭️  ${result.caseName}: ${result.reason}`)
    } else if (result.passed) {
      const warnings = result.warnings > 0 ? ` (${result.warnings} 个警告)` : ''
      console.log(`✅ ${result.caseName}: 通过${warnings}`)
    } else {
      console.log(`❌ ${result.caseName}: ${result.reason || '失败'}`)
      
      if (result.schemaErrors && result.schemaErrors.length > 0) {
        console.log('   Schema 错误:')
        result.schemaErrors.forEach(err => {
          console.log(`     - ${err}`)
        })
      }
      
      if (result.differences && result.differences.length > 0) {
        console.log('   差异:')
        result.differences.forEach(diff => {
          const severity = diff.severity === 'warning' ? '⚠️' : '❌'
          console.log(`     ${severity} ${diff.path}:`)
          console.log(`       期望: ${diff.expected}`)
          console.log(`       实际: ${diff.actual}`)
          if (diff.message) {
            console.log(`       说明: ${diff.message}`)
          }
        })
      }
      
      if (result.error) {
        console.log(`   错误: ${result.error}`)
      }
    }
  }
  
  // 统计结果
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed && !r.skipped).length
  const skipped = results.filter(r => r.skipped).length
  const total = results.length
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 评测结果统计:')
  console.log(`   总计: ${total}`)
  console.log(`   ✅ 通过: ${passed}`)
  console.log(`   ❌ 失败: ${failed}`)
  console.log(`   ⏭️  跳过: ${skipped}`)
  
  if (total > 0) {
    const passRate = ((passed / (total - skipped)) * 100).toFixed(1)
    console.log(`   📈 通过率: ${passRate}%`)
  }
  
  console.log('='.repeat(50))
  
  // 如果有失败，退出码为 1
  if (failed > 0) {
    process.exit(1)
  }
}

// 运行
if (require.main === module) {
  main()
}

module.exports = { evaluateCase, validateSchema, compareFields }







