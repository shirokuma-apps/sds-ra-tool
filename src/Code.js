const GHS_DRIVE_IDS = {
  GHS_可燃:  '1Favhb1bHxeJWUnTvciGY9zi6cHVS1njg',
  GHS_支燃:  '1TY-oJv3bX39o1bQ22N-wbvquviKw5-lH',
  GHS_爆発:  '10aIntelf0sNfEl53DtJ1K14EERU35Wkb',
  GHS_腐食:  '1gZCsrJ1e6VxLR-0mLH_8H0raFPmZkJ2p',
  GHS_ガス:  '1UGjTbzgx7EMvSO2sKoJPSPi8EwzPFAol',
  GHS_毒性1: '1A-XtOEIGYQEt2zGNgB8irYF_-S45a0lM',
  GHS_毒性2: '1y3he2DP-rgy2yXBo5g-MPuPrm_rOD83n',
  GHS_環境:  '1LWjeEBez6vGQH27EimS1Kc-sDN19CkMR',
  GHS_臓器:  '1rZyP7XEqKE7JyS1VSH6RcQ7_CM5VvCuh',
};

function _getGhsImages() {
  const result = {};
  for (const [key, id] of Object.entries(GHS_DRIVE_IDS)) {
    try {
      const blob = DriveApp.getFileById(id).getBlob();
      result[key] = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
    } catch (_) {
      result[key] = '';
    }
  }
  return result;
}

function _buildReportTemplate(id, implementor, date) {
  const template = HtmlService.createTemplateFromFile('templates/report');
  template.data        = DbService.getMaterialData(Number(id));
  template.implementor = implementor || '';
  template.date        = date        || '';
  template.ghsImages   = _getGhsImages();
  return template;
}

function doGet(e) {
  if (e.parameter.page === 'report') {
    return _buildReportTemplate(e.parameter.id, e.parameter.implementor, e.parameter.date)
      .evaluate()
      .setTitle('リスクアセスメント')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService.createHtmlOutputFromFile('templates/index')
    .setTitle('SDS リスクアセスメントツール')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// インラインプレビュー用: HTMLを文字列で返す
function getReportHtml(id, implementor, date) {
  return _buildReportTemplate(id, implementor, date).evaluate().getContent();
}

function searchMaterials(query) {
  return DbService.searchMaterials(query);
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}
