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

            return this.forecastAt(M.spellsCastTotal);
        },


        /*
         * 指定したスペル回数のFtHoFを予測
         *
         * 現在の乱数生成ロジックをそのまま使用し、
         * spellCountだけを変えて未来の手を予測する。
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
            var log = [];

            function loggedRandom(label) {
                var value = Math.random();

                log.push({
                    label: label,
                    value: value
                });

                return value;
            }

            Math.seedrandom(
                Game.seed + '/' + spellCount
            );

            var failRoll =
                loggedRandom('Backfire判定');

            var success =
                failRoll < (1 - failChance);

            /*
             * 現在のコードと同じ季節判定
             */
            if (
                Game.season === 'easter' ||
                Game.season === 'valentines'
            ) {
                loggedRandom('季節判定');
            }

            var choices = [];

            if (success) {

                choices.push(
                    'Frenzy',
                    'Lucky'
                );

                if (!Game.hasBuff('Dragonflight')) {
                    choices.push(
                        'Click Frenzy'
                    );
                }

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

                var stormDropRoll =
                    loggedRandom(
                        'Cookie Storm Drop判定'
                    );

                if (stormDropRoll < 0.15) {
                    choices = [
                        'Cookie Storm Drop'
                    ];
                }

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

                choices.push(
                    'Clot',
                    'Ruin Cookies'
                );

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

                var lumpRollFail =
                    loggedRandom(
                        'Free Sugar Lump判定'
                    );

                if (lumpRollFail < 0.003) {
                    choices.push(
                        'Free Sugar Lump'
                    );
                }

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

            Math.seedrandom();

            return {
                spellCount: spellCount,
                seed: Game.seed,
                failChance: failChance,
                failRoll: failRoll,
                success: success,
                result: result,
                choices: choices,
                randomLog: log
            };
        },


        /*
         * 次の10手をまとめて予測
         */
        forecastMany: function (count) {
            var M = this.getGrimoire();

            if (!M) return [];

            var startCount = M.spellsCastTotal;
            var forecasts = [];

            for (var i = 1; i <= count; i++) {
                forecasts.push(
                    this.forecastAt(startCount + i)
                );
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

            var spellsCast =
                this.getSpellsCastTotal();

            var seed =
                this.getSeed();

            /*
             * 次の10手を予測
             */
            var forecasts =
                this.forecastMany(10);

            var next =
                forecasts.length ?
                    forecasts[0] :
                    {
                        result: '--',
                        failChance: 0.15
                    };

            /*
             * 10手予測一覧
             */
            var rowsHTML = '';

            if (forecasts.length) {

                for (
                    var i = 0;
                    i < forecasts.length;
                    i++
                ) {

                    var f = forecasts[i];

                    /*
                     * 表の乱数は、現在のコードと同じ
                     * Backfire判定の乱数を表示。
                     *
                     * 詳細な乱数は行をクリックすると表示。
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
                                '<div style="margin:2px 0;">' +
                                    '<span style="display:inline-block;width:25px;">' +
                                        (j + 1) +
                                    '.</span>' +
                                    '<span style="display:inline-block;width:190px;">' +
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
                            'data-fthof-row="' + i + '">' +

                            '<td style="padding:5px 7px;white-space:nowrap;">' +
                                i + '手目 / ' +
                                f.spellCount + '回' +
                            '</td>' +

                            '<td style="padding:5px 7px;white-space:nowrap;">' +
                                backfireText +
                            '</td>' +

                            '<td style="padding:5px 7px;font-family:monospace;white-space:nowrap;">' +
                                mainRandom.toFixed(10) +
                            '</td>' +

                            '<td style="padding:5px 7px;">' +
                                '<b>' + f.result + '</b>' +
                            '</td>' +

                        '</tr>' +

                        '<tr id="FtHoFRandomRow' + i + '" style="display:none;">' +
                            '<td colspan="4" style="padding:4px 7px 8px 20px;">' +
                                '<div style="font-size:12px;font-family:monospace;">' +
                                    detailHTML +
                                '</div>' +
                            '</td>' +
                        '</tr>';
                }

            } else {

                rowsHTML =
                    '<tr>' +
                        '<td colspan="4">予測データなし</td>' +
                    '</tr>';
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

                        '<br><br>' +

                        '<b>Seed：</b>' +
                        seed +

                        '<br>' +

                        '<b>現在の総スペル回数：</b>' +
                        spellsCast +

                    '</div>' +

                    '<div class="listing">' +

                        '<b>次の10手</b>' +

                        '<br><br>' +

                        '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +

                            '<thead>' +
                                '<tr>' +
                                    '<th style="text-align:left;padding:5px 7px;">手数 / 呪文総回数</th>' +
                                    '<th style="text-align:left;padding:5px 7px;">バックファイア</th>' +
                                    '<th style="text-align:left;padding:5px 7px;">乱数</th>' +
                                    '<th style="text-align:left;padding:5px 7px;">効果</th>' +
                                '</tr>' +
                            '</thead>' +

                            '<tbody>' +
                                rowsHTML +
                            '</tbody>' +

                        '</table>' +

                        '<br>' +

                        '<small style="opacity:0.7;">' +
                            '行をタップすると、その手で使用した乱数の詳細を表示します。' +
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
             * 各予測行のクリックで乱数詳細を開閉
             */
            for (var rowIndex = 0; rowIndex < forecasts.length; rowIndex++) {

                (function (index) {

                    var row =
                        section.querySelector(
                            '[data-fthof-row="' + index + '"]'
                        );

                    var randomRow =
                        document.getElementById(
                            'FtHoFRandomRow' + index
                        );

                    if (row && randomRow) {

                        row.onclick =
                            function () {

                                if (
                                    randomRow.style.display ===
                                    'none'
                                ) {
                                    randomRow.style.display = '';
                                } else {
                                    randomRow.style.display = 'none';
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
