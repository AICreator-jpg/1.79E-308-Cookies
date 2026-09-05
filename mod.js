(function () {
    'use strict';

    console.log('[FtHoF Planner] loading...');

    var FtHoFPlanner = {

        isOpen: false,

        // 今回の予測で使った乱数
        randomLog: [],


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
         * 総スペル回数
         */
        getSpellsCastTotal: function () {
            var M = this.getGrimoire();

            if (!M) return '--';

            return M.spellsCastTotal || 0;
        },


        /*
         * Seed
         */
        getSeed: function () {
            return Game.seed || '--';
        },


        /*
         * バックファイア率
         */
        getFailChance: function () {
            var M = this.getGrimoire();

            if (!M) return 0.15;

            var spell = M.spells['hand of fate'];

            if (!spell) return 0.15;

            return M.getFailChance(spell);
        },


        /*
         * 乱数を取得すると同時に記録する
         */
        random: function (label) {

            var value = Math.random();

            this.randomLog.push({
                label: label,
                value: value
            });

            return value;
        },


        /*
         * FtHoF予測
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
             * 前回の乱数ログを消去
             */
            this.randomLog = [];


            /*
             * Cookie Clicker本体と同じSeed
             */
            Math.seedrandom(
                Game.seed + '/' + spellCount
            );


            /*
             * ==========================
             * Call 1
             * バックファイア判定
             * ==========================
             */
            var failRoll =
                this.random('Backfire判定');


            var success =
                failRoll < (1 - failChance);


            /*
             * ==========================
             * Golden Cookie生成時の
             * 追加乱数
             * ==========================
             *
             * FtHoFはnew Game.shimmer('golden')
             * を作るため、ここから追加の
             * Math.random()が消費される。
             */


            /*
             * 季節による追加判定
             *
             * v2.058ではEaster/Valentineで
             * 追加の乱数消費がある。
             */
            if (
                Game.season === 'easter' ||
                Game.season === 'valentines'
            ) {

                this.random(
                    '季節判定'
                );

            }


            /*
             * ==========================
             * 成功時
             * ==========================
             */
            var choices = [];


            if (success) {

                choices.push(
                    'Frenzy',
                    'Lucky'
                );


                /*
                 * Dragonflight中は
                 * Click Frenzyなし
                 */
                if (!Game.hasBuff('Dragonflight')) {

                    choices.push(
                        'Click Frenzy'
                    );

                }


                /*
                 * 10% Cookie Storm
                 */
                var stormRoll =
                    this.random(
                        'Cookie Storm判定'
                    );


                if (stormRoll < 0.1) {

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

                    var buildingRoll =
                        this.random(
                            'Building Special判定'
                        );


                    if (buildingRoll < 0.25) {

                        choices.push(
                            'Building Special'
                        );

                    }

                }


                /*
                 * Cookie Storm Drop
                 */
                var stormDropRoll =
                    this.random(
                        'Cookie Storm Drop判定'
                    );


                if (stormDropRoll < 0.15) {

                    choices = [
                        'Cookie Storm Drop'
                    ];

                }


                /*
                 * Free Sugar Lump
                 */
                var lumpRoll =
                    this.random(
                        'Free Sugar Lump判定'
                    );


                if (lumpRoll < 0.0001) {

                    choices.push(
                        'Free Sugar Lump'
                    );

                }


            } else {

                /*
                 * ==========================
                 * バックファイア時
                 * ==========================
                 */

                choices.push(
                    'Clot',
                    'Ruin Cookies'
                );


                /*
                 * Cursed Finger / Elder Frenzy
                 */
                var curseRoll =
                    this.random(
                        'Cursed Finger判定'
                    );


                if (curseRoll < 0.1) {

                    choices.push(
                        'Cursed Finger',
                        'Elder Frenzy'
                    );

                }


                /*
                 * Free Sugar Lump
                 */
                var lumpRollFail =
                    this.random(
                        'Free Sugar Lump判定'
                    );


                if (lumpRollFail < 0.003) {

                    choices.push(
                        'Free Sugar Lump'
                    );

                }


                /*
                 * Blab
                 */
                var blabRoll =
                    this.random(
                        'Blab判定'
                    );


                if (blabRoll < 0.1) {

                    choices = [
                        'Blab'
                    ];

                }

            }


            /*
             * ==========================
             * 最終候補選択
             * ==========================
             */
            var chooseRoll =
                this.random(
                    '最終結果選択'
                );


            var chosenIndex =
                Math.floor(
                    chooseRoll * choices.length
                );


            var result =
                choices[chosenIndex];


            /*
             * 元のMath.randomへ戻す
             */
            Math.seedrandom();


            return {

                spellCount: spellCount,

                seed: Game.seed,

                failChance: failChance,

                failRoll: failRoll,

                success: success,

                result: result,

                choices: choices,

                randomLog: this.randomLog.slice()

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


            /*
             * スクロール位置保存
             */
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
             * 現在の情報
             */
            var spellsCast =
                this.getSpellsCastTotal();

            var seed =
                this.getSeed();


            /*
             * 予測
             */
            var forecast =
                this.forecastNext();


            /*
             * 結果
             */
            var forecastText =
                forecast.result || '--';


            /*
             * 乱数表示HTML
             */
            var randomHTML = '';


            if (
                forecast.randomLog &&
                forecast.randomLog.length
            ) {

                for (
                    var i = 0;
                    i < forecast.randomLog.length;
                    i++
                ) {

                    var r =
                        forecast.randomLog[i];

                    randomHTML +=
                        '<div style="margin:3px 0;">' +

                            '<span style="display:inline-block;' +
                                'width:25px;">' +

                                (i + 1) +

                            '.</span>' +

                            '<span style="display:inline-block;' +
                                'width:190px;">' +

                                r.label +

                            '</span>' +

                            '<span>' +

                                r.value.toFixed(10) +

                            '</span>' +

                        '</div>';
                }

            } else {

                randomHTML =
                    '乱数データなし';

            }


            /*
             * Planner
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


                    /*
                     * 基本情報
                     */
                    '<div class="listing">' +

                        '<b>Force the Hand of Fate</b>' +

                        '<br><br>' +

                        '<b>総スペル回数：</b>' +
                        spellsCast +

                        '<br>' +

                        '<b>Seed：</b>' +
                        seed +

                    '</div>' +


                    /*
                     * 予測結果
                     */
                    '<div class="listing">' +

                        '<b>次回FtHoF</b>' +

                        '<br><br>' +

                        '<span style="font-size:18px;">' +

                            forecastText +

                        '</span>' +

                        '<br><br>' +

                        '<b>成功率：</b>' +

                        (
                            ((1 - forecast.failChance) * 100)
                            .toFixed(2)
                        ) +

                        '%' +

                    '</div>' +


                    /*
                     * 乱数
                     */
                    '<div class="listing">' +

                        '<b>乱数</b>' +

                        '<br>' +

                        '<small style="opacity:0.7;">' +

                            'この予測で使用した乱数値' +

                        '</small>' +

                        '<div style="' +
                            'margin-top:8px;' +
                            'font-family:monospace;' +
                            'font-size:12px;' +
                        '">' +

                            randomHTML +

                        '</div>' +

                    '</div>' +


                '</div>';


            /*
             * Options末尾へ追加
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
            menu.scrollTop =
                scrollTop;


            console.log(
                '[FtHoF Planner] forecast:',
                forecast
            );
        }
    };


    /*
     * 元のGame.UpdateMenuを保存
     */
    var originalUpdateMenu =
        Game.UpdateMenu;


    /*
     * Game.UpdateMenuを拡張
     */
    Game.UpdateMenu =
        function () {

            /*
             * 本来の処理
             */
            originalUpdateMenu.apply(
                Game,
                arguments
            );


            /*
             * OptionsならPlanner更新
             */
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
        '乱数表示を追加しました。',
        [16, 5],
        3
    );


    console.log(
        '[FtHoF Planner] loaded'
    );

})();
