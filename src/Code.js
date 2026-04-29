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

function doGet(e) {
  if (e.parameter.page === 'report') {
    const template = HtmlService.createTemplateFromFile('templates/report');
    template.data        = DbService.getMaterialData(Number(e.parameter.id));
    template.implementor = e.parameter.implementor || '';
    template.date        = e.parameter.date        || '';
    template.ghsImages   = _getGhsImages();
    return template.evaluate()
      .setTitle('リスクアセスメント')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
