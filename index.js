const fs = require('fs');
const { parse } = require('@babel/eslint-parser');
const traverse = require('@babel/traverse').default;
const path = require('path');

// Função para extrair propriedades de um atributo JSX
function extractProps(attr) {
  if (!attr || typeof attr !== 'string') {
    return {};
  }

  const props = {};
  const propsRegex = /([A-Za-z][A-Za-z0-9]*)\s*=\s*{([^}]*)}/g;
  let match;
  while ((match = propsRegex.exec(attr))) {
    const [, prop, value] = match;
    props[prop] = value;
  }
  return props;
}

// Função para extrair componentes JSX e suas propriedades
function extractComponents(codigo) {
  const components = {};

  const ast = parse(codigo, {
    sourceType: 'module',
    plugins: ['jsx'],
  });

  traverse(ast, {
    JSXElement(path) {
      const { node } = path;
      const componentName = node.openingElement.name.name;
      const attributes = node.openingElement.attributes;
      const attrsString = attributes.length ? attributes.reduce((acc, attr) => acc + codigo.substring(attr.start, attr.end), '') : '';

      components[componentName] = extractProps(attrsString);
    },
  });

  return components;
}

// Caminho absoluto ou relativo para o arquivo .tsx
const filePath = path.join(__dirname, 'meu_codigo.tsx');

// Leitura do arquivo .tsx
fs.readFile(filePath, 'utf-8', (err, codigo) => {
  if (err) {
    console.error('Erro ao ler o arquivo:', err);
    return;
  }

  const components = extractComponents(codigo);

  // Imprimir os resultados
  for (const componentName in components) {
    console.log(`Componente: ${componentName}`);
    for (const prop in components[componentName]) {
      console.log(`   - Propriedade: ${prop}, Valor: ${components[componentName][prop]}`);
    }
  }
});