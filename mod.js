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
        forecastAt: function (spellCount) {

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


            var failChance = this.getFailChance();


            /*
             * 乱数ログ
             */
            var randomLog = [];

            function loggedRandom(label) {
                var value = Math.random();

                randomLog.push({
                    label: label,
                    value: value
                });

                return value;
            }


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
                loggedRandom('Backfire判定');


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

                loggedRandom(
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
                    loggedRandom(
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
                        loggedRandom(
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
                    loggedRandom(
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
                    loggedRandom(
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
                    loggedRandom(
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
                    loggedRandom(
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
                    loggedRandom(
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
                loggedRandom(
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

                randomLog: randomLog.slice()
            };
        },


        /*
         * 次のFtHoFを予測
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

            return this.forecastAt(
                M.spellsCastTotal
            );
        },


        /*
         * 次の10手を予測
         *
         * 内部RNG：
         *   現在のspellsCastTotalから開始
         *
         * 表示：
         *   現在値+1を1手目として表示
         */
        forecastMany: function (count) {

            var M =
                this.getGrimoire();

            if (!M) return [];


            var startCount =
                M.spellsCastTotal;

            var forecasts = [];


            for (
                var i = 0;
                i < count;
                i++
            ) {

                forecasts.push({

                    /*
                     * 表示上の手数
                     */
                    hand:
                        i + 1,

                    /*
                     * 表示上の呪文総回数
                     */
                    displaySpellCount:
                        startCount + i + 1,

                    /*
                     * 内部RNGに使う回数
                     */
                    forecast:
                        this.forecastAt(
                            startCount + i
                        )
                });
            }


            return forecasts;
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
             * 次の10手を予測
             */
            var forecasts =
                this.forecastMany(10);


            /*
             * 10手一覧HTML
             */
            var rowsHTML = '';


            for (
                var i = 0;
                i < forecasts.length;
                i++
            ) {

                var item =
                    forecasts[i];

                var f =
                    item.forecast;


                /*
                 * 表に表示するメイン乱数
                 * = バックファイア判定乱数
                 */
                var mainRandom =
                    f.randomLog &&
                    f.randomLog.length ?
                        f.randomLog[0].value :
                        0;


                var backfireText =
                    f.success ?
                        '成功' :
                        '失敗';


                /*
                 * 詳細乱数
                 */
                var detailHTML = '';


                if (
                    f.randomLog &&
                    f.randomLog.length
                ) {

                    for (
                        var j = 0;
                        j < f.randomLog.length;
                        j++
                    ) {

                        var r =
                            f.randomLog[j];


                        detailHTML +=
                            '<div style="margin:3px 0;">' +

                                '<span style="' +
                                    'display:inline-block;' +
                                    'width:25px;">' +

                                    (j + 1) +

                                '.</span>' +

                                '<span style="' +
                                    'display:inline-block;' +
                                    'width:190px;">' +

                                    r.label +

                                '</span>' +

                                '<span>' +

                                    r.value.toFixed(10) +

                                '</span>' +

                            '</div>';
                    }
                }


                rowsHTML +=

                    '<tr style="cursor:pointer;" ' +
                        'data-fthof-row="' +
                            i +
                        '">' +

                        '<td style="' +
                            'padding:5px 7px;' +
                            'white-space:nowrap;">' +

                            item.hand +
                            '手目 / ' +
                            item.displaySpellCount +
                            '回' +

                        '</td>' +


                        '<td style="' +
                            'padding:5px 7px;' +
                            'white-space:nowrap;">' +

                            backfireText +

                        '</td>' +


                        '<td style="' +
                            'padding:5px 7px;' +
                            'font-family:monospace;' +
                            'white-space:nowrap;">' +

                            mainRandom.toFixed(10) +

                        '</td>' +


                        '<td style="' +
                            'padding:5px 7px;">' +

                            '<b>' +
                                f.result +
                            '</b>' +

                        '</td>' +

                    '</tr>' +


                    '<tr id="FtHoFRandomRow' +
                        i +
                        '" style="display:none;">' +

                        '<td colspan="4" style="' +
                            'padding:4px 7px 8px 20px;">' +

                            '<div style="' +
                                'font-size:12px;' +
                                'font-family:monospace;">' +

                                detailHTML +

                            '</div>' +

                        '</td>' +

                    '</tr>';
            }


            if (!rowsHTML) {

                rowsHTML =
                    '<tr>' +
                        '<td colspan="4">' +
                            '予測データなし' +
                        '</td>' +
                    '</tr>';
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

                        (this.isOpen ?
                            '−' :
                            '+') +

                    '</span>' +

                '</div>' +


                '<div id="FtHoFPlannerBody" ' +
                    'style="display:' +
                        (this.isOpen ?
                            '' :
                            'none') +
                    ';">' +


                    '<div class="listing">' +

                        '<b>' +
                            'Force the Hand of Fate' +
                        '</b>' +

                        '<br><br>' +

                        '<b>総スペル回数：</b>' +

                        spellsCast +

                        '<br>' +

                        '<b>Seed：</b>' +

                        seed +

                    '</div>' +


                    '<div class="listing">' +

                        '<b>次の10手</b>' +

                        '<br><br>' +


                        '<table style="' +
                            'width:100%;' +
                            'border-collapse:collapse;' +
                            'font-size:13px;">' +


                            '<thead>' +

                                '<tr>' +

                                    '<th style="' +
                                        'text-align:left;' +
                                        'padding:5px 7px;">' +

                                        '手数 / 呪文総回数' +

                                    '</th>' +


                                    '<th style="' +
                                        'text-align:left;' +
                                        'padding:5px 7px;">' +

                                        'バックファイア' +

                                    '</th>' +


                                    '<th style="' +
                                        'text-align:left;' +
                                        'padding:5px 7px;">' +

                                        '乱数' +

                                    '</th>' +


                                    '<th style="' +
                                        'text-align:left;' +
                                        'padding:5px 7px;">' +

                                        '効果' +

                                    '</th>' +

                                '</tr>' +

                            '</thead>' +


                            '<tbody>' +

                                rowsHTML +

                            '</tbody>' +

                        '</table>' +


                        '<br>' +


                        '<small style="' +
                            'opacity:0.7;">' +

                            '行をタップすると、' +
                            'その手で使用した乱数の詳細を表示します。' +

                        '</small>' +

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


            if (
                title &&
                body &&
                toggle
            ) {

                title.onclick =
                    function () {

                        if (
                            body.style.display ===
                            'none'
                        ) {

                            body.style.display =
                                '';

                            toggle.textContent =
                                '−';

                            FtHoFPlanner.isOpen =
                                true;

                        } else {

                            body.style.display =
                                'none';

                            toggle.textContent =
                                '+';

                            FtHoFPlanner.isOpen =
                                false;

                        }

                    };
            }


            /*
             * 各行のクリックで
             * 乱数詳細を開閉
             */
            for (
                var rowIndex = 0;
                rowIndex < forecasts.length;
                rowIndex++
            ) {

                (function (index) {

                    var row =
                        section.querySelector(
                            '[data-fthof-row="' +
                                index +
                            '"]'
                        );


                    var randomRow =
                        document.getElementById(
                            'FtHoFRandomRow' +
                                index
                        );


                    if (
                        row &&
                        randomRow
                    ) {

                        row.onclick =
                            function () {

                                if (
                                    randomRow.style.display ===
                                    'none'
                                ) {

                                    randomRow.style.display =
                                        '';

                                } else {

                                    randomRow.style.display =
                                        'none';

                                }

                            };
                    }

                })(rowIndex);
            }


            /*
             * スクロール位置復元
             */
            menu.scrollTop =
                scrollTop;


            console.log(
                '[FtHoF Planner] forecasts:',
                forecasts
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
