#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as assert from 'assert';
import recast from 'recast';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const source = await fs.promises.readFile(
  path.join(__dirname, '../index.mjs'),
  'utf8',
);
const ast = recast.parse(source);

const { builders: b, namedTypes: n } = recast.types;

const nodes = ast.program.body;

const exportsMemberExpression = b.memberExpression(
  b.identifier('module'),
  b.identifier('exports'),
);

for (const [i, node] of nodes.entries()) {
  if (n.ExportDefaultDeclaration.check(node)) {
    node.declaration.type = 'FunctionExpression';
    nodes[i] = b.expressionStatement(
      b.assignmentExpression('=', exportsMemberExpression, node.declaration),
    );

    continue;
  }

  if (!n.ExportNamedDeclaration.check(node)) continue;

  let id, init;
  if (n.VariableDeclaration.check(node.declaration)) {
    assert.strictEqual(
      node.declaration.declarations.length,
      1,
      'Expected a single declaration',
    );
    assert.ok(node.declaration.declarations[0].init, 'No initializer found');
    ({ id, init } = node.declaration.declarations[0]);
  } else if (
    n.ClassDeclaration.check(node.declaration) ||
    n.FunctionDeclaration.check(node.declaration)
  ) {
    id = node.declaration.id;
    init = node.declaration;
  } else {
    throw new Error('Unsupported named export');
  }

  nodes[i] = b.expressionStatement(
    b.assignmentExpression(
      '=',
      b.memberExpression(exportsMemberExpression, id),
      init,
    ),
  );
}

await fs.promises.mkdir(path.join(__dirname, '../dist'), { recursive: true });

await fs.promises.writeFile(
  path.join(__dirname, '../dist/index.cjs'),
  recast.prettyPrint(ast, { quote: 'single' }).code,
);
