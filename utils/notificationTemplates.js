const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

function renderTemplate(templateName, data) {
  const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
  const templateStr = fs.readFileSync(templatePath, 'utf8');
  const template = Handlebars.compile(templateStr);
  return template(data);
}

module.exports = { renderTemplate };