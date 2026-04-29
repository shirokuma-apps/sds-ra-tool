const DbService = {

  _getSpreadsheet() {
    const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!id) throw new Error('スクリプトプロパティ SPREADSHEET_ID が未設定です');
    return SpreadsheetApp.openById(id);
  },

  _loadSheet(ss, name) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) throw new Error(`シートが見つかりません: ${name}`);
    const [headers, ...rows] = sheet.getDataRange().getValues();
    return rows
      .filter(r => r.some(v => v !== '' && v !== null))
      .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
  },

  _buildMap(rows, key) {
    return Object.fromEntries(rows.map(r => [r[key], r]));
  },

  // 材料検索（部分一致・最大50件）
  searchMaterials(query) {
    const ss = this._getSpreadsheet();
    const rows = this._loadSheet(ss, '材料マスタ');
    const q = query.trim().toLowerCase();
    return rows
      .filter(r => String(r['材料名']).toLowerCase().includes(q))
      .slice(0, 50)
      .map(r => ({
        material_id: Number(r['material_id']),
        頭文字: r['頭文字'] || null,
        材料名: String(r['材料名']),
      }));
  },

  // 材料データ一式取得（PDF生成用）
  getMaterialData(materialId) {
    const ss  = this._getSpreadsheet();
    const mid = Number(materialId);

    const material = this._loadSheet(ss, '材料マスタ').find(r => Number(r['material_id']) === mid);
    if (!material) throw new Error(`材料が見つかりません: ${materialId}`);

    const chemMasterMap = this._buildMap(this._loadSheet(ss, '化学物質マスタ'), 'chemical_id');
    const chemicals = this._loadSheet(ss, '材料×化学物質')
      .filter(r => Number(r['material_id']) === mid)
      .map(r => ({
        化学物質名:       chemMasterMap[r['chemical_id']]?.['化学物質名'] ?? '',
        含有率最小:       r['含有率最小'],
        含有率最大:       r['含有率最大'],
        推定濃度_長時間:  r['推定濃度_長時間'],
        推定濃度_短時間:  r['推定濃度_短時間'],
        許容濃度:         chemMasterMap[r['chemical_id']]?.['許容濃度'] ?? '',
      }));

    const hazardMasterMap = this._buildMap(this._loadSheet(ss, '有害性マスタ'), 'hazard_id');
    const hazards = this._loadSheet(ss, '材料×有害性')
      .filter(r => Number(r['material_id']) === mid)
      .map(r => ({
        有害性内容: hazardMasterMap[r['hazard_id']]?.['有害性内容'] ?? '',
        点数:       r['点数'],
      }));

    const filterMid = name => this._loadSheet(ss, name).filter(r => Number(r['material_id']) === mid);

    return {
      material,
      chemicals,
      hazards,
      riskReductions:  filterMid('リスク低減措置'),
      protectiveEquip: filterMid('保護具'),
      firstAids:       filterMid('応急処置'),
      fireAgents:      filterMid('緊急対応_消火剤'),
      fireMethods:     filterMid('緊急対応_消火方法'),
      spillResponses:  filterMid('緊急対応_漏出時措置'),
    };
  },
};
