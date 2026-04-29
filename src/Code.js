function doGet(e) {
  if (e.parameter.page === 'report') {
    const template = HtmlService.createTemplateFromFile('templates/report');
    template.data        = DbService.getMaterialData(Number(e.parameter.id));
    template.implementor = e.parameter.implementor || '';
    template.date        = e.parameter.date        || '';
    return template.evaluate()
      .setTitle('リスクアセスメント')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  }

  return HtmlService.createHtmlOutputFromFile('templates/index')
    .setTitle('SDS リスクアセスメントツール')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function searchMaterials(query) {
  return DbService.searchMaterials(query);
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}
