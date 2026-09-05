(function () {
    'use strict';

    console.log('[FtHoF Planner] loading...');

    var FtHoFPlanner = {

        isOpen: false,

        /*
         * Grimoire取得
         */
        getGrimoire: function () {
            var wizardTower = Game.Objects['Wizard tower'];

            if (!wizardTower || !wizardTower.minigame) {
                return null;
            }

            return wizardTower.minigame;
        },


        /*
         * 現在のスペル総数
         */
        getSpellsCastTotal: function () {
            var M = this.getGrimoire();

            if (!M) return '--';

            return M.spellsCastTotal || 0;
        },


        /*
         * 現在のSeed
         */
        getSeed: function () {
            return Game.seed || '--';
        },


        /*
         * FtHoFのバックファイア率
         *
         * ゲーム本体のgetFailChanceを利用する。
         */
        getFailChance: function () {
            var M = this.getGrimoire();

            if (!M) return 0.15;

            var spell = M.spells['hand of fate'];

            if (!spell) return 0.15;

            return M.getFailChance(spell);
        },


        /*
         * FtHoFの乱数予測
         *
         * ここが今回の核心。
         */
        forecastNext: function () {

            var M = this.getGrimoire();

            if (!M) {
                return {
                    result: 'Grimoire unavailable'
                };
            }


            var spell = M.spells['hand of fate'];

            if (!spell) {
                return {
                    result: 'FtHoF unavailable'
                };
            }


            var spellCount = M.spellsCastTotal;

            var failChance = this.getFailChance();


            /*
             * Cookie Clicker本体と同じSeedを設定
             */
            Math.seedrandom(
                Game.seed + '/' + spellCount
            );


            /*
             * 最初の乱数
             *
             * 本体：
             * Math.random() < (1 - failChance)
             */
            var successRoll = Math.random();


            var success =
                successRoll < (1 - failChance);


            /*
             * Game.shimmer('golden') の
             * initFuncによって消費される乱数を再現する。
             *
             * noWrathなのでwrath判定そのものは発生しない。
             */


            // Valentine's / Easterでは画像選択用乱数が1回入る
            var seasonalRandom = 0;

            if (
                Game.season === 'valentines' ||
                Game.season === 'easter'
            ) {
                seasonalRandom = 1;
            }


            /*
             * Golden shimmerの座標用乱数
             */
            Math.random();
            Math.random();


            if (seasonalRandom) {
                /*
                 * 画像選択用
                 */
                Math.random();
            }


            /*
             * 結果候補
             */
            var choices = [];


            if (success) {

                /*
                 * 必ず存在
                 */
                choices.push(
                    'Frenzy',
                    'Lucky'
                );


                /*
                 * Dragonflight中はClick Frenzyなし
                 */
                if (!Game.hasBuff('Dragonflight')) {

                    choices.push(
                        'Click Frenzy'
                    );

                }


                /*
                 * 10%
                 *
                 * Cookie Storm
                 * Cookie Storm
                 * Blab
                 */
                if (Math.random() < 0.1) {

                    choices.push(
                        'Cookie Storm',
                        'Cookie Storm',
                        'Blab'
                    );

                }


                /*
                 * Building Special
                 */
                if (Game.BuildingsOwned >= 10) {

                    if (Math.random() < 0.25) {

                        choices.push(
                            'Building Special'
                        );

                    }

                }


                /*
                 * Cookie Storm Drop
                 *
                 * 15%で候補を完全に置き換える
                 */
                if (Math.random() < 0.15) {

                    choices = [
                        'Cookie Storm Drop'
                    ];

                }


                /*
                 * Sugar Lump
                 */
                if (Math.random() < 0.0001) {

                    choices.push(
                        'Sugar Lump'
                    );

                }


            } else {

                /*
                 * バックファイア
                 */
                choices.push(
                    'Clot',
                    'Ruin Cookies'
                );


                /*
                 * Cursed Finger / Elder Frenzy
                 */
                if (Math.random() < 0.1) {

                    choices.push(
                        'Cursed Finger',
                        'Elder Frenzy'
                    );

                }


                /*
                 * Sugar Lump
                 */
                if (Math.random() < 0.003) {

                    choices.push(
                        'Sugar Lump'
                    );

                }


                /*
                 * Blab
                 *
                 * 10%で候補を完全に置き換える
                 */
                if (Math.random() < 0.1) {

                    choices = [
                        'Blab'
                    ];

                }

            }


            /*
             * 最終的なchoose()
             */
            var chosenIndex =
                Math.floor(
                    Math.random() * choices.length
                );


            var result =
                choices[chosenIndex];


            /*
             * 本体は最後にMath.seedrandom()で
             * 通常の乱数状態へ戻す。
             */
            Math.seedrandom();


            return {

                spellCount: spellCount,

                seed: Game.seed,

                failChance: failChance,

                successRoll: successRoll,

                success: success,

                result: result

            };
        },


        /*
         * Options更新
         */
        updateOptionsMenu: function () {

            var menu =
                document.getElementById('menu');

            if (!menu) return;


            /*
             * 開閉状態保存
             */
            var oldBody =
                document.getElementById(
                    'FtHoFPlannerBody'
                );

            if (oldBody) {

                this.isOpen =
                    oldBody.style.display !== 'none';

            }


            var scrollTop =
                menu.scrollTop;


            /*
             * 古いPlanner削除
             */
            var old =
                document.getElementById(
                    'FtHoFPlannerOptions'
                );

            if (old) {
                old.remove();
            }


            /*
             * データ取得
             */
            var spellsCast =
                this.getSpellsCastTotal();

            var seed =
                this.getSeed();


            var forecast =
                this.forecastNext();


            /*
             * 予測結果
             */
            var forecastText =
                forecast.result || '--';


            var resultClass =
                '';


            if (forecast.success) {
                resultClass = 'green';
            } else {
                resultClass = 'red';
            }


            /*
             * Planner本体
             */
            var section =
                document.createElement('div');

            section.id =
                'FtHoFPlannerOptions';

            section.className =
                'listing';


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

                        '<b>Force the Hand of Fate</b>' +

                    '</div>' +


                    '<div class="listing">' +

                        '<b>総スペル回数：</b>' +
                        spellsCast +

                        '<br>' +

                        '<b>Seed：</b>' +
                        seed +

                    '</div>' +


                    '<div class="listing">' +

                        '<b>次回FtHoF</b>' +

                        '<br><br>' +

                        '<span class="' +
                            resultClass +
                            '" ' +
                            'style="font-size:18px;">' +

                            forecastText +

                        '</span>' +

                        '<br><br>' +

                        '<small>' +

                            '成功率：' +

                            (
                                ((1 - forecast.failChance) * 100)
                                .toFixed(2)
                            ) +

                            '%' +

                        '</small>' +

                    '</div>' +


                '</div>';


            /*
             * Options末尾に追加
             */
            menu.appendChild(section);


            /*
             * 開閉
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

                title.onclick =
                    function () {

                        if (
                            body.style.display ===
                            'none'
                        ) {

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
             * スクロール位置復元
             */
            menu.scrollTop = scrollTop;


            console.log(
                '[FtHoF Planner] forecast:',
                forecast
            );
        }
    };


    /*
     * Game.UpdateMenuを拡張
     */
    var originalUpdateMenu =
        Game.UpdateMenu;


    Game.UpdateMenu =
        function () {

            originalUpdateMenu.apply(
                Game,
                arguments
            );


            if (
                Game.onMenu === 'prefs'
            ) {

                FtHoFPlanner.updateOptionsMenu();

            }

        };


    /*
     * 読み込み確認
     */
    Game.Notify(
        'FtHoF Planner',
        'FtHoF予測エンジンを読み込みました。',
        [16, 5],
        3
    );


    console.log(
        '[FtHoF Planner] loaded'
    );

})();
