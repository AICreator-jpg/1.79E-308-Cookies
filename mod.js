(function () {
    'use strict';

    console.log('[FtHoF Planner] loading...');

    var FtHoFPlanner = {
        id: 'FtHoFPlanner',

        updateOptionsMenu: function () {
            var menu = document.getElementById('menu');
            if (!menu) return;

            // Optionsが再生成された場合でも毎回作り直す
            var old = document.getElementById('FtHoFPlannerOptions');
            if (old) old.remove();

            var section = document.createElement('div');
            section.id = 'FtHoFPlannerOptions';
            section.className = 'listing';

            section.innerHTML =
                '<div class="title" id="FtHoFPlannerTitle" style="cursor:pointer;">' +
                    'FtHoF Planner <span id="FtHoFPlannerToggle">+</span>' +
                '</div>' +

                '<div id="FtHoFPlannerBody" style="display:none;">' +
                    '<div class="listing">' +
                        '<b>FtHoF Planner</b><br>' +
                        'Force the Hand of Fate Planner' +
                    '</div>' +

                    '<div class="listing">' +
                        'ここにFtHoFの予測結果を表示します。' +
                    '</div>' +
                '</div>';

            menu.appendChild(section);

            var title = document.getElementById('FtHoFPlannerTitle');
            var body = document.getElementById('FtHoFPlannerBody');
            var toggle = document.getElementById('FtHoFPlannerToggle');

            title.onclick = function () {
                if (body.style.display === 'none') {
                    body.style.display = '';
                    toggle.textContent = '−';
                } else {
                    body.style.display = 'none';
                    toggle.textContent = '+';
                }
            };

            console.log('[FtHoF Planner] Options updated');
        }
    };


    /*
     * Game.UpdateMenu を利用する
     *
     * 元のGame.UpdateMenuを保存して、
     * その処理が終わった後にFtHoF Plannerを追加する。
     */
    var originalUpdateMenu = Game.UpdateMenu;

    Game.UpdateMenu = function () {
        originalUpdateMenu.apply(Game, arguments);

        if (Game.onMenu === 'prefs') {
            FtHoFPlanner.updateOptionsMenu();
        }
    };


    Game.Notify(
        'FtHoF Planner',
        'MODを読み込みました。',
        [16, 5],
        3
    );

    console.log('[FtHoF Planner] loaded');

})();
