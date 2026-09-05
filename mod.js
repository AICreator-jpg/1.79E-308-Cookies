(function () {
    'use strict';

    var FtHoFPlanner = {};

    FtHoFPlanner.name = 'FtHoF Planner';

    FtHoFPlanner.OptionsMenu = function () {
        var menu = l('menu');
        if (!menu) return;

        // FtHoF Planner の設定欄
        menu.innerHTML +=
            '<div class="listing" id="FtHoFPlannerOptions">' +

                '<div class="title" id="FtHoFPlannerTitle" ' +
                    'style="cursor:pointer;">' +
                    'FtHoF Planner <span id="FtHoFPlannerPlus">+</span>' +
                '</div>' +

                '<div id="FtHoFPlannerBody" style="display:none;">' +

                    '<div class="listing">' +
                        '<b>Force the Hand of Fate Planner</b>' +
                        '<br>' +
                        '<label>' +
                        'FtHoF の結果を予測するプランナーです。' +
                        '</label>' +
                    '</div>' +

                    '<div class="listing">' +
                        '<b>Spell casts:</b> ' +
                        '<span id="FtHoFPlannerSpellCount">--</span>' +
                    '</div>' +

                    '<div class="listing">' +
                        '<b>Seed:</b> ' +
                        '<span id="FtHoFPlannerSeed">--</span>' +
                    '</div>' +

                    '<div class="listing">' +
                        '<b>予測結果</b>' +
                        '<br>' +
                        '<span style="opacity:0.7;">' +
                        'ここに FtHoF の予測結果を表示します。' +
                        '</span>' +
                    '</div>' +

                '</div>' +
            '</div>';

        // 折りたたみボタン
        var title = l('FtHoFPlannerTitle');
        var body = l('FtHoFPlannerBody');
        var plus = l('FtHoFPlannerPlus');

        if (title && body) {
            title.onclick = function () {
                if (body.style.display === 'none') {
                    body.style.display = '';
                    if (plus) plus.innerHTML = '−';
                } else {
                    body.style.display = 'none';
                    if (plus) plus.innerHTML = '+';
                }
            };
        }

        // 現在の情報を表示
        var wizardTower = Game.Objects['Wizard tower'];

        if (wizardTower &&
            wizardTower.minigame &&
            l('FtHoFPlannerSpellCount')) {

            l('FtHoFPlannerSpellCount').innerHTML =
                wizardTower.minigame.spellsCastTotal || 0;
        }

        if (l('FtHoFPlannerSeed')) {
            l('FtHoFPlannerSeed').innerHTML =
                Game.seed || '--';
        }
    };

    /*
     * Options が開かれたときに呼ばれる
     */
    Game.customOptionsMenu.push(FtHoFPlanner.OptionsMenu);

    console.log('[FtHoF Planner] loaded');
})();
