#!/usr/bin/env node
/**
 * Import integrity checker (JS/TS + JSX aware).
 * Uses @babel/parser to gather exported identifiers (named) for every source file
 * then validates that every named import refers to an existing export in the target.
 *
 * Design goals:
 *  - Zero false positives for JSX (previous es-module-lexer approach skipped many files)
 *  - Lightweight (single parse pass per file)
 *  - No deep re-export graph resolution (export * treated as wildcard)
 */
import fg from 'fast-glob'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import { parse as babelParse } from '@babel/parser'

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..')

// file -> Set(exportedNames)  (special markers: *all*, *cjs*)
const exportCache = new Map()

function parseCode(code, file) {
  return babelParse(code, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'classProperties',
      'topLevelAwait',
      'importMeta'
    ],
    errorRecovery: true
  })
}

function collectExports(ast, code) {
  const names = new Set()
  for (const node of ast.program.body) {
    switch (node.type) {
      case 'ExportNamedDeclaration': {
        if (node.declaration) {
          const decl = node.declaration
            ; if (decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration') {
              if (decl.id) names.add(decl.id.name)
            } else if (decl.type === 'VariableDeclaration') {
              for (const d of decl.declarations) {
                if (d.id.type === 'Identifier') names.add(d.id.name)
                // Ignore patterns for now
              }
            }
        }
        if (node.specifiers?.length) {
          for (const s of node.specifiers) {
            // exported name is what importers use
            if (s.exported && s.exported.type === 'Identifier') names.add(s.exported.name)
          }
        }
        break
      }
      case 'ExportDefaultDeclaration': {
        // We don't validate default imports (script only checks named), but keep marker if needed later
        names.add('default')
        break
      }
      case 'ExportAllDeclaration': {
        // Wildcard export – treat as exporting everything
        names.add('*all*')
        break
      }
      default:
        break
    }
  }
  if (/module\.exports|exports\./.test(code)) names.add('*cjs*')
  return names
}

async function buildExportCache() {
  const files = await fg(['src/**/*.{js,jsx,ts,tsx}'], { cwd: root, absolute: true, ignore: ['**/*.d.ts'] })
  for (const file of files) {
    try {
      const code = await readFile(file, 'utf8')
      const ast = parseCode(code, file)
      exportCache.set(file, collectExports(ast, code))
    } catch (e) {
      console.warn('[export-scan] parse failed', path.relative(root, file), e.message)
      exportCache.set(file, new Set()) // still set to avoid repeated work
    }
  }
}

function resolveImport(fromFile, spec) {
  if (spec.startsWith('.') || spec.startsWith('/')) {
    const abs = path.resolve(path.dirname(fromFile), spec)
    const candidates = [
      abs,
      abs + '.js', abs + '.jsx', abs + '.ts', abs + '.tsx',
      path.join(abs, 'index.js'), path.join(abs, 'index.jsx'), path.join(abs, 'index.ts'), path.join(abs, 'index.tsx')
    ]
    for (const c of candidates) {
      if (exportCache.has(c)) return c
    }
    return null
  }
  return null // external – ignore
}

async function check() {
  await buildExportCache()
  const files = await fg(['src/**/*.{js,jsx,ts,tsx}'], { cwd: root, absolute: true, ignore: ['**/*.d.ts'] })
  let problems = 0
  for (const file of files) {
    let code
    try { code = await readFile(file, 'utf8') } catch { continue }
    let ast
    try { ast = parseCode(code, file) } catch (e) {
      console.warn('[import-scan] parse failed', path.relative(root, file), e.message)
      continue
    }
    for (const node of ast.program.body) {
      if (node.type !== 'ImportDeclaration') continue
      const spec = node.source.value
      if (spec.startsWith('http') || spec.startsWith('data:')) continue
      const resolved = resolveImport(file, spec)
      if (!resolved) continue
      const exported = exportCache.get(resolved) || new Set()
      if (exported.has('*all*') || exported.has('*cjs*')) continue
      for (const s of node.specifiers) {
        if (s.type === 'ImportSpecifier') {
          const importedName = s.imported.name
          if (!exported.has(importedName)) {
            console.error(`Import integrity: '${importedName}' not exported from ${path.relative(root, resolved)} (imported in ${path.relative(root, file)})`)
            problems++
          }
        }
      }
    }
  }
  if (problems) {
    console.error(`\nImport integrity check failed with ${problems} issue(s).`)
    process.exit(1)
  } else {
    console.log('Import integrity check passed.')
  }
}

check().catch(err => {
  console.error('Integrity checker crashed:', err)
  process.exit(1)
})
