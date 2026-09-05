(function () {
    'use strict';

    console.log('[FtHoF Planner] loading...');

    var FtHoFPlanner = {

        // Plannerが開いているかどうか
        isOpen: false,

        updateOptionsMenu: function () {
            var menu = document.getElementById('menu');
            if (!menu) return;

            /*
             * 現在の状態を保存
             *
             * Cookie Clickerがメニューを再生成する前に、
             * Plannerの開閉状態とスクロール位置を覚えておく。
             */
            var oldBody = document.getElementById('FtHoFPlannerBody');

            if (oldBody) {
                this.isOpen = (oldBody.style.display !== 'none');
            }

            var scrollTop = menu.scrollTop;

            /*
             * 古いPlannerを削除
             */
            var old = document.getElementById('FtHoFPlannerOptions');

            if (old) {
                old.remove();
            }

            /*
             * FtHoF Planner
             */
            var section = document.createElement('div');

            section.id = 'FtHoFPlannerOptions';
            section.className = 'listing';

            section.innerHTML =
                '<div class="title" ' +
                    'id="FtHoFPlannerTitle" ' +
                    'style="cursor:pointer;">' +

                    'FtHoF Planner ' +

                    '<span id="FtHoFPlannerToggle">' +
                        (this.isOpen ? '−' : '+') +
                    '</span>' +

                '</div>' +

                '<div id="FtHoFPlannerBody" ' +
                    'style="display:' +
                        (this.isOpen ? '' : 'none') +
                    ';">' +

                    '<div class="listing">' +
                        '<b>FtHoF Planner</b><br>' +
                        'Force the Hand of Fate Planner' +
                    '</div>' +

                    '<div class="listing">' +
                        'ここにFtHoFの予測結果を表示します。' +
                    '</div>' +

                '</div>';

            /*
             * Optionsの最後に追加
             */
            menu.appendChild(section);

            /*
             * 開閉処理
             */
            var title =
                document.getElementById('FtHoFPlannerTitle');

            var body =
                document.getElementById('FtHoFPlannerBody');

            var toggle =
                document.getElementById('FtHoFPlannerToggle');

            if (title && body && toggle) {

                title.onclick = function () {

                    if (body.style.display === 'none') {

                        body.style.display = '';
                        toggle.textContent = '−';

                        FtHoFPlanner.isOpen = true;

                    } else {

                        body.style.display = 'none';
                        toggle.textContent = '+';

                        FtHoFPlanner.isOpen = false;
                    }
                };
            }

            /*
             * メニューのスクロール位置を復元
             */
            menu.scrollTop = scrollTop;

            console.log(
                '[FtHoF Planner] Options updated. open=' +
                this.isOpen
            );
        }
    };


    /*
     * 元のGame.UpdateMenuを保存
     */
    var originalUpdateMenu = Game.UpdateMenu;


    /*
     * Game.UpdateMenuを拡張
     */
    Game.UpdateMenu = function () {

        /*
         * Cookie Clicker本来の処理
         */
        originalUpdateMenu.apply(Game, arguments);


        /*
         * Options画面の場合だけ
         * FtHoF Plannerを追加
         */
        if (Game.onMenu === 'prefs') {
            FtHoFPlanner.updateOptionsMenu();
        }
    };


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
