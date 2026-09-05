(function () {
    'use strict';

    var FtHoFPlanner = {
        id: 'FtHoFPlanner',

        createOptionsMenu: function () {
            var menu = l('menu');

            if (!menu) {
                console.log('[FtHoF Planner] menu が見つかりません');
                return;
            }

            // Options が再構築された場合に備えて、
            // 同じ要素が既に存在していたら追加しない
            if (l('FtHoFPlannerOptions')) {
                return;
            }

            // Cookie Monster風の折りたたみセクション
            var section = document.createElement('div');
            section.id = 'FtHoFPlannerOptions';
            section.className = 'listing';

            section.innerHTML =
                '<div class="title" id="FtHoFPlannerTitle" ' +
                    'style="cursor:pointer;">' +
                    'FtHoF Planner ' +
                    '<span id="FtHoFPlannerToggle">+</span>' +
                '</div>' +

                '<div id="FtHoFPlannerBody" style="display:none;">' +

                    '<div class="listing">' +
                        '<b>FtHoF Planner</b><br>' +
                        'Force the Hand of Fate の予測プランナーです。' +
                    '</div>' +

                    '<div class="listing">' +
                        'ここに今後、予測結果を表示します。' +
                    '</div>' +

                '</div>';

            // Options の一番最後に追加
            menu.appendChild(section);

            // 開閉処理
            var title = l('FtHoFPlannerTitle');
            var body = l('FtHoFPlannerBody');
            var toggle = l('FtHoFPlannerToggle');

            if (title && body) {
                title.onclick = function () {
                    if (body.style.display === 'none') {
                        body.style.display = '';
                        if (toggle) {
                            toggle.innerHTML = '−';
                        }
                    } else {
                        body.style.display = 'none';
                        if (toggle) {
                            toggle.innerHTML = '+';
                        }
                    }
                };
            }

            console.log('[FtHoF Planner] Options に追加しました');
        }
    };

    /*
     * Cookie Clicker の Options メニュー更新時に呼ぶ
     */
    if (!Game.customOptionsMenu) {
        Game.customOptionsMenu = [];
    }

    Game.customOptionsMenu.push(
        FtHoFPlanner.createOptionsMenu
    );

    /*
     * 読み込み確認
     */
    Game.Notify(
        'FtHoF Planner',
        'MODを読み込みました。',
        [16, 5],
        3
    );

    console.log('[FtHoF Planner] loaded');

})();
