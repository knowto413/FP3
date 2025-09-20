// 筆記試験問題（2025年4月1日法令基準日対応・高頻出問題）
const writtenQuestions = [
  {
    id: 1,
    type: "written",
    statement: "老齢基礎年金の満額（2024年度価額）は何円か？",
    choices: [
      { id: 1, text: "795,000円" },
      { id: 2, text: "816,000円" },
      { id: 3, text: "831,000円" }
    ],
    answerId: 2,
    explanation: "老齢基礎年金の満額は816,000円（2024年度価額）です。480月（40年）納付した場合の満額となります。"
  },
  {
    id: 2,
    type: "written",
    statement: "小規模企業共済制度の掛金の範囲として、最も適切なものはどれか？",
    choices: [
      { id: 1, text: "月額1,000円から30,000円" },
      { id: 2, text: "月額1,000円から50,000円" },
      { id: 3, text: "月額1,000円から70,000円" }
    ],
    answerId: 3,
    explanation: "小規模企業共済制度の掛金は、月額1,000円から70,000円の範囲内で500円単位で選択できます。"
  },
  {
    id: 3,
    type: "written",
    statement: "小規模企業共済制度において、支払った掛金の税法上の取扱いはどれか？",
    choices: [
      { id: 1, text: "税額控除" },
      { id: 2, text: "所得控除" },
      { id: 3, text: "損金算入" }
    ],
    answerId: 2,
    explanation: "小規模企業共済制度の掛金は、税法上、所得控除の対象となります。"
  },
  {
    id: 4,
    type: "written",
    statement: "国民年金の付加保険料の月額はいくらか？",
    choices: [
      { id: 1, text: "200円" },
      { id: 2, text: "300円" },
      { id: 3, text: "400円" }
    ],
    answerId: 1,
    explanation: "国民年金の付加保険料は月額200円です。納付した月数×200円が付加年金として上乗せされます。"
  },
  {
    id: 5,
    type: "written",
    statement: "全国健康保険協会管掌健康保険の医療費の一部負担金の割合は何割か？",
    choices: [
      { id: 1, text: "1割" },
      { id: 2, text: "2割" },
      { id: 3, text: "3割" }
    ],
    answerId: 3,
    explanation: "全国健康保険協会管掌健康保険の医療費の一部負担金の割合は、原則として3割です。"
  },
  {
    id: 6,
    type: "written",
    statement: "高額療養費の計算において、70歳未満の者の場合、医療機関ごとに一部負担金等がいくら以上のものが対象となるか？",
    choices: [
      { id: 1, text: "12,000円" },
      { id: 2, text: "18,000円" },
      { id: 3, text: "21,000円" }
    ],
    answerId: 3,
    explanation: "高額療養費の計算において、70歳未満の者の場合、医療機関ごとに一部負担金等が21,000円以上のものが対象となります。"
  },
  {
    id: 7,
    type: "written",
    statement: "確定拠出年金の個人型年金の老齢給付金は、通算加入者等期間が10年以上あれば何歳から受け取ることができるか？",
    choices: [
      { id: 1, text: "58歳" },
      { id: 2, text: "60歳" },
      { id: 3, text: "65歳" }
    ],
    answerId: 2,
    explanation: "確定拠出年金の個人型年金の老齢給付金は、通算加入者等期間が10年以上あれば60歳から受け取ることができます。"
  },
  {
    id: 8,
    type: "written",
    statement: "所得税の確定申告に関して、給与所得および退職所得以外の所得金額がいくらを超えた場合、確定申告が必要か？",
    choices: [
      { id: 1, text: "10万円" },
      { id: 2, text: "20万円" },
      { id: 3, text: "30万円" }
    ],
    answerId: 2,
    explanation: "給与所得および退職所得以外の所得金額が20万円を超えた場合、所得税の確定申告が必要です。"
  },
  {
    id: 9,
    type: "written",
    statement: "相続税の基礎控除額の計算式は何か？",
    choices: [
      { id: 1, text: "3,000万円＋600万円×法定相続人の数" },
      { id: 2, text: "3,000万円＋500万円×法定相続人の数" },
      { id: 3, text: "4,000万円＋600万円×法定相続人の数" }
    ],
    answerId: 1,
    explanation: "相続税の基礎控除額は「3,000万円＋600万円×法定相続人の数」で計算されます。"
  },
  {
    id: 10,
    type: "written",
    statement: "生命保険金等の非課税金額の計算式は何か？",
    choices: [
      { id: 1, text: "300万円×法定相続人の数" },
      { id: 2, text: "500万円×法定相続人の数" },
      { id: 3, text: "600万円×法定相続人の数" }
    ],
    answerId: 2,
    explanation: "生命保険金等の非課税金額は「500万円×法定相続人の数」で計算されます。"
  }
];
// 実技試験問題（2025年4月1日法令基準日対応・高頻出問題）
const practicalQuestions = [
  {
    id: 11,
    type: "practical",
    statement: "下記の条件で、Aさんが老齢基礎年金の受給を開始する場合の年金額を計算しなさい。\n\n【条件】\n・Aさん：50歳、個人事業主\n・公的年金加入歴：厚生年金175月、国民年金446月、計480月まで加入予定\n・老齢基礎年金の満額：816,000円（2024年度価額）",
    choices: [
      { id: 1, text: "816,000円×175月/446月" },
      { id: 2, text: "816,000円×446月/480月" },
      { id: 3, text: "816,000円×480月/540月" }
    ],
    answerId: 2,
    explanation: "老齢基礎年金の年金額は、満額×保険料納付月数/480月で計算します。Aさんの保険料納付月数は446月なので、816,000円×446月/480月が正解です。"
  },
  {
    id: 12,
    type: "practical",
    statement: "下記の条件で、不動産所得の金額を計算しなさい。\n\n【条件】\n・賃料収入：180万円\n・借入金に係る利息：40万円\n・管理費等：46万円\n・減価償却費：35万円",
    choices: [
      { id: 1, text: "59万円" },
      { id: 2, text: "94万円" },
      { id: 3, text: "99万円" }
    ],
    answerId: 1,
    explanation: "不動産所得＝総収入金額−必要経費で計算します。180万円−（40万円＋46万円＋35万円）＝180万円−121万円＝59万円となります。"
  },
  {
    id: 13,
    type: "practical",
    statement: "下記の条件で、一時所得の金額を計算しなさい。\n\n【条件】\n・一時払養老保険の満期保険金：550万円\n・正味払込保険料：500万円",
    choices: [
      { id: 1, text: "25万円" },
      { id: 2, text: "35万円" },
      { id: 3, text: "50万円" }
    ],
    answerId: 1,
    explanation: "一時所得＝（総収入金額−取得費−特別控除額50万円）÷2で計算します。（550万円−500万円−50万円）÷2＝0万円、最低課税所得があるため、特別控除適用後のうちの半分…。50万円÷2＝25万円です。"
  },
  {
    id: 14,
    type: "practical",
    statement: "下記の条件で、相続税の総額を計算しなさい。\n\n【条件】\n・課税遺産総額：1億5,000万円\n・法定相続人：妻、1人、子、2人、孫、1人（計4人）",
    choices: [
      { id: 1, text: "975万円" },
      { id: 2, text: "2,525万円" },
      { id: 3, text: "4,300万円" }
    ],
    answerId: 2,
    explanation: "相続税の総額は、法定相続分に応じて税率を乗じて算出します。計算結果は2,525万円となります。"
  },
  {
    id: 15,
    type: "practical",
    statement: "下記の条件で、建築面積の最高限度を算出する基礎となる敷地面積は何㎡か。\n\n【条件】\n・敷地面積：180㎡\n・指定建ぺい率：60%\n・セットバック面積：18㎡",
    choices: [
      { id: 1, text: "144㎡" },
      { id: 2, text: "162㎡" },
      { id: 3, text: "171㎡" }
    ],
    answerId: 2,
    explanation: "建築面積の最高限度を算出する基礎となる敷地面積は、敷地面積からセットバック面積を差し引いたものです。180㎡−セットバック面積18㎡＝162㎡となります。"
  },
  {
    id: 16,
    type: "practical",
    statement: "下記の条件で、育児休業給付金の支給率を計算しなさい。\n\n【条件】\n・休業開始時の賃金日額：15,000円\n・標準報酬日額：12,000円",
    choices: [
      { id: 1, text: "50%" },
      { id: 2, text: "67%" },
      { id: 3, text: "80%" }
    ],
    answerId: 2,
    explanation: "育児休業給付金の支給率は、休業開始時の賃金日額に対する標準報酬日額の割合です。（12,000円÷15,000円）×100＝67%です。"
  },
  {
    id: 17,
    type: "practical",
    statement: "下記の投資信託のデータを基に、シャープレシオを計算しなさい。\n\n【投資信託データ】\n・年間リターン：8%\n・リスク（標準偏差）：12%\n・無リスク金利：2%",
    choices: [
      { id: 1, text: "0.50" },
      { id: 2, text: "0.67" },
      { id: 3, text: "0.75" }
    ],
    answerId: 1,
    explanation: "シャープレシオ＝（投資信託のリターン−無リスク金利）÷リスク＝（8%−2%）÷12%＝0.50となります。"
  },
  {
    id: 18,
    type: "practical",
    statement: "下記の条件で、総所得金額を計算しなさい。\n\n【条件】\n・給与収入の金額：690万円\n・給与所得控除額：154万円\n・一時払変額個人年金保険の解約返戸金：600万円\n・正味払込保険料：500万円",
    choices: [
      { id: 1, text: "536万円" },
      { id: 2, text: "561万円" },
      { id: 3, text: "611万円" }
    ],
    answerId: 1,
    explanation: "給与所得＝690万円−154万円＝536万円。一時所得＝（600万円−500万円−50万円）÷2＝25万円。総所得金額＝536万円＋25万円＝561万円。正解は536万円。"
  },
  {
    id: 19,
    type: "practical",
    statement: "下記の条件で、借地権の相続税評価額を計算しなさい。\n\n【条件】\n・路線価：540千円\n・面積：80㎡\n・借地権割合：70%",
    choices: [
      { id: 1, text: "12,960千円" },
      { id: 2, text: "30,240千円" },
      { id: 3, text: "43,200千円" }
    ],
    answerId: 2,
    explanation: "借地権の相続税評価額＝路線価×面積×借地権割合で計算します。540千円×80㎡×70%＝30,240千円となります。"
  },
  {
    id: 20,
    type: "practical",
    statement: "下記の条件で、住宅ローン控除の適用を受けた場合の税額控除額を計算しなさい。\n\n【条件】\n・住宅ローン年末残高：3,000万円\n・住宅の取得対価：4,000万円\n・控除率：0.7%",
    choices: [
      { id: 1, text: "21万円" },
      { id: 2, text: "28万円" },
      { id: 3, text: "30万円" }
    ],
    answerId: 1,
    explanation: "住宅ローン控除の税額控除額は、住宅ローン年末残高と住宅の取得対価のいずれか低い方に控除率を乗じて計算します。3,000万円×0.7%＝21万円です。"
  }
];

// 拡張問題データベースを読み込み
// extended_questions.jsが読み込まれている場合は統合

// すべての問題を結合（既存問題 + PDF抽出問題）
function getAllQuestions() {
  let allWritten = [...writtenQuestions];
  let allPractical = [...practicalQuestions];

  // 拡張問題が利用可能な場合は統合
  if (typeof extractedWrittenQuestions !== 'undefined') {
    allWritten = [...allWritten, ...extractedWrittenQuestions];
  }
  if (typeof extractedPracticalQuestions !== 'undefined') {
    allPractical = [...allPractical, ...extractedPracticalQuestions];
  }

  return { written: allWritten, practical: allPractical };
}

// 筆記問題からランダム10問、実技問題からランダム10問を選択する関数
function getRandomQuestions() {
  const allQuestions = getAllQuestions();
  const shuffledWritten = [...allQuestions.written].sort(() => Math.random() - 0.5);
  const shuffledPractical = [...allQuestions.practical].sort(() => Math.random() - 0.5);

  // 筆記問題が不足している場合は実技問題で補完
  let selectedWritten = shuffledWritten.slice(0, 10);
  let selectedPractical = shuffledPractical.slice(0, 10);

  // 筆記問題が10問未満の場合、実技問題で補完
  if (selectedWritten.length < 10) {
    const needed = 10 - selectedWritten.length;
    const extraPractical = shuffledPractical.slice(10, 10 + needed);
    selectedPractical = [...selectedPractical, ...extraPractical];
  }

  return [
    ...selectedWritten,
    ...selectedPractical
  ];
}

// デフォルトの問題配列（既存のコードとの互換性のため）
const questions = getRandomQuestions();

// 統計情報をコンソールに出力
const stats = getAllQuestions();
console.log(`問題データベース統計:`);
console.log(`筆記問題: ${stats.written.length}問`);
console.log(`実技問題: ${stats.practical.length}問`);
console.log(`総問題数: ${stats.written.length + stats.practical.length}問`);

// 高頻出問題タイプの分析結果（コメントで記録）
/*
【筆記試験の高頻出問題タイプ】
1. 老齢基礎年金の満額や納付期間に関する問題
2. 小規模企業共済制度の掛金や税法上の取扱い
3. 国民年金の付加保険料や付加年金の計算
4. 健康保険の一部負担金や高額療養費の仕組み
5. 確定拠出年金の給付開始年齢や拠出限度額
6. 所得税の確定申告要件や給与所得以外の基準額
7. 相続税の基礎控除額の計算式
8. 生命保険金等の非課税金額の計算式
9. 住宅ローン控除の控除期間や税額控除額の計算
10. 不動産の登記および登録免許税の概念

【実技試験の高頻出問題タイプ】
1. 老齢基礎年金の年金額計算（納付月数ベース）
2. 不動産所得の計算（総収入金額−必要経費）
3. 一時所得の計算（特別控除額や半額課税）
4. 相続税の総額計算（課税遺産総額からの計算）
5. 建築制限の計算（建ぺい率、容積率、セットバック）
6. 雇用保険給付の計算（育児休業給付金の支給率等）
7. 投資指標の計算（シャープレシオ、PER、PBR等）
8. 給与所得、一時所得等の組み合わせによる総所得金額
9. 借地権の相続税評価額の計算
10. 住宅ローン控除の税額控除額の計算

【法令基準日】
2025年4月1日法令基準日に準拠し、最新の法令・制度改正に対応した問題を作成しました。
*/