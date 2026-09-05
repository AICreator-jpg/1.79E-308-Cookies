(function () {
    'use strict';

    console.log('[FtHoF Planner] loading...');

    var FtHoFPlanner = {

        // Plannerが開いているか
        isOpen: false,


        /*
         * Wizard Towerから現在の情報を取得
         */
        getGrimoire: function () {
            var wizardTower = Game.Objects['Wizard tower'];

            if (!wizardTower) {
                return null;
            }

            if (!wizardTower.minigame) {
                return null;
            }

            return wizardTower.minigame;
        },


        /*
         * 現在のスペル総数を取得
         */
        getSpellsCastTotal: function () {
            var grimoire = this.getGrimoire();

            if (!grimoire) {
                return '--';
            }

            return grimoire.spellsCastTotal || 0;
        },


        /*
         * 現在のSeedを取得
         */
        getSeed: function () {
            if (typeof Game.seed === 'undefined') {
                return '--';
            }

            return Game.seed;
        },


        /*
         * Optionsを更新
         */
        updateOptionsMenu: function () {

            var menu = document.getElementById('menu');

            if (!menu) {
                return;
            }


            /*
             * 現在の開閉状態を保存
             */
            var oldBody =
                document.getElementById('FtHoFPlannerBody');

            if (oldBody) {
                this.isOpen =
                    oldBody.style.display !== 'none';
            }


            /*
             * スクロール位置を保存
             */
            var scrollTop = menu.scrollTop;


            /*
             * 古いPlannerを削除
             */
            var old =
                document.getElementById('FtHoFPlannerOptions');

            if (old) {
                old.remove();
            }


            /*
             * Planner本体を作成
             */
            var section =
                document.createElement('div');

            section.id = 'FtHoFPlannerOptions';
            section.className = 'listing';


            /*
             * 現在のゲーム情報
             */
            var spellsCast =
                this.getSpellsCastTotal();

            var seed =
                this.getSeed();


            /*
             * HTML
             */
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


                    /*
                     * タイトル
                     */
                    '<div class="listing">' +

                        '<b>Force the Hand of Fate Planner</b>' +

                    '</div>' +


                    /*
                     * 総スペル回数
                     */
                    '<div class="listing">' +

                        '<b>総スペル回数</b><br>' +

                        '<span id="FtHoFPlannerSpellCount">' +
                            spellsCast +
                        '</span>' +

                    '</div>' +


                    /*
                     * Seed
                     */
                    '<div class="listing">' +

                        '<b>現在のSeed</b><br>' +

                        '<span id="FtHoFPlannerSeed">' +
                            seed +
                        '</span>' +

                    '</div>' +


                    /*
                     * 次のステップ用
                     */
                    '<div class="listing">' +

                        '<b>予測結果</b><br>' +

                        '<span style="opacity:0.7;">' +
                            'ここにFtHoFの予測結果を表示します。' +
                        '</span>' +

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
                document.getElementById(
                    'FtHoFPlannerTitle'
                );

            var body =
                document.getElementById(
                    'FtHoFPlannerBody'
                );

            var toggle =
                document.getElementById(
                    'FtHoFPlannerToggle'
                );


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
             * スクロール位置を復元
             */
            menu.scrollTop = scrollTop;


            console.log(
                '[FtHoF Planner] ' +
                'spells=' + spellsCast +
                ' seed=' + seed
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
         * Options画面のときだけ
         * Plannerを追加
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
