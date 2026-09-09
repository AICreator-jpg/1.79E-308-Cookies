(function () {
    'use strict';

    console.log('[FtHoF Planner] loading...');

    var FtHoFPlanner = {

        isOpen: false,

        // プランナー設定パネルの開閉状態
        settingsOpen: true,

        // バックファイア率設定
        settings: {
            supremeIntellect: false,
            realityBending: false,
            diminishIneptitude: false,
            diminishIneptitudeBackfire: false,
            dragonflight: false
        },

        // ハイライト設定
        // 初期ON：クリックフィーバー、施設特殊効果、エルダーフィーバー、無料の砂糖玉
        highlightSettings: {
            'Frenzy': false,
            'Lucky': false,
            'Click Frenzy': true,
            'Cookie Storm': false,
            'Building Special': true,
            'Cookie Storm Drop': false,
            'Free Sugar Lump': true,
            'Clot': false,
            'Ruin Cookies': false,
            'Cursed Finger': false,
            'Elder Frenzy': true,
            'Blab': false
        },

        // コンボ検索設定
        comboOpen: true,
        highlightOpen: true,
        comboCrossSeason: false,
        comboSettings: [
            { effect: '', gc: 0, mode: 'gte' },
            { effect: '', gc: 0, mode: 'gte' },
            { effect: '', gc: 0, mode: 'gte' },
            { effect: '', gc: 0, mode: 'gte' }
        ],

        // 予測手数
        forecastCount: 10,

        // 各行の詳細表示状態をUpdateMenu再構築後も保持
        expandedRows: {},

        // 今回の予測で使った乱数
        randomLog: [],

        // マイセッティング保存枠
        // 0=設定1、1=設定2、2=設定3、-1=自動ロードなし
        mySettings: [null, null, null],
        autoLoadSlot: -1,

        /*
         * 保存した名前をHTMLへ安全に表示する
         */
        escapeHtml: function (text) {
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        },

        /*
         * 現在の設定を保存用データにまとめる
         */
        getCurrentSettingData: function () {
            var data = {
                settings: {},
                highlightSettings: {},
                comboCrossSeason: this.comboCrossSeason,
                comboSettings: [],
                forecastCount: this.forecastCount,
                isOpen: this.isOpen,
                settingsOpen: this.settingsOpen,
                comboOpen: this.comboOpen,
                highlightOpen: this.highlightOpen
            };

            for (var settingKey in this.settings) {
                if (this.settings.hasOwnProperty(settingKey)) {
                    data.settings[settingKey] = !!this.settings[settingKey];
                }
            }

            for (var highlightKey in this.highlightSettings) {
                if (this.highlightSettings.hasOwnProperty(highlightKey)) {
                    data.highlightSettings[highlightKey] = !!this.highlightSettings[highlightKey];
                }
            }

            for (var comboIndex = 0; comboIndex < 4; comboIndex++) {
                data.comboSettings.push({
                    effect: this.comboSettings[comboIndex].effect,
                    gc: this.comboSettings[comboIndex].gc,
                    mode: this.comboSettings[comboIndex].mode
                });
            }

            return data;
        },

        /*
         * 画面上の最新設定を内部データへ反映
         */
        syncCurrentSettingsFromUI: function () {
            var si = document.getElementById('FtHoFSettingSI');
            var rb = document.getElementById('FtHoFSettingRB');
            var di = document.getElementById('FtHoFSettingDI');
            var diBackfire = document.getElementById('FtHoFSettingDIBackfire');
            var df = document.getElementById('FtHoFSettingDragonflight');

            if (si) this.settings.supremeIntellect = si.checked;
            if (rb) this.settings.realityBending = rb.checked;
            if (di) this.settings.diminishIneptitude = di.checked;
            if (diBackfire) this.settings.diminishIneptitudeBackfire = diBackfire.checked;
            if (df) this.settings.dragonflight = df.checked;

            var forecastCountInput = document.getElementById('FtHoFForecastCount');
            if (forecastCountInput) {
                var parsedForecastCount = parseInt(forecastCountInput.value, 10);
                if (isNaN(parsedForecastCount)) parsedForecastCount = 10;
                this.forecastCount = Math.max(1, Math.min(500, parsedForecastCount));
            }

            var oldPlannerBody = document.getElementById('FtHoFPlannerBody');
            if (oldPlannerBody) {
                this.isOpen = oldPlannerBody.style.display !== 'none';
            }

            var oldSettingsBody = document.getElementById('FtHoFPlannerSettingsBody');
            if (oldSettingsBody) {
                this.settingsOpen = oldSettingsBody.style.display !== 'none';
            }

            var oldComboBody = document.getElementById('FtHoFPlannerComboBody');
            if (oldComboBody) {
                this.comboOpen = oldComboBody.style.display !== 'none';
            }

            var oldHighlightBody = document.getElementById('FtHoFPlannerHighlightBody');
            if (oldHighlightBody) {
                this.highlightOpen = oldHighlightBody.style.display !== 'none';
            }

            var highlightEffects = [
                'Frenzy', 'Lucky', 'Click Frenzy', 'Cookie Storm',
                'Building Special', 'Cookie Storm Drop', 'Free Sugar Lump',
                'Clot', 'Ruin Cookies', 'Cursed Finger', 'Elder Frenzy', 'Blab'
            ];

            for (var highlightIndex = 0; highlightIndex < highlightEffects.length; highlightIndex++) {
                var highlightEffect = highlightEffects[highlightIndex];
                var highlightId = 'FtHoFHighlight_' + highlightEffect.replace(/[^a-zA-Z0-9]/g, '_');
                var highlightCheckbox = document.getElementById(highlightId);
                if (highlightCheckbox) {
                    this.highlightSettings[highlightEffect] = highlightCheckbox.checked;
                }
            }

            var crossSeason = document.getElementById('FtHoFComboCrossSeason');
            if (crossSeason) {
                this.comboCrossSeason = crossSeason.checked;
            }

            for (var comboIndex = 0; comboIndex < 4; comboIndex++) {
                var effectSelect = document.getElementById('FtHoFComboEffect' + comboIndex);
                var gcInput = document.getElementById('FtHoFComboGc' + comboIndex);
                var modeSelect = document.getElementById('FtHoFComboMode' + comboIndex);

                if (effectSelect) this.comboSettings[comboIndex].effect = effectSelect.value;
                if (gcInput) {
                    var parsedGc = parseInt(gcInput.value, 10);
                    if (isNaN(parsedGc)) parsedGc = 0;
                    this.comboSettings[comboIndex].gc = Math.max(0, Math.min(10, parsedGc));
                }
                if (modeSelect) this.comboSettings[comboIndex].mode = modeSelect.value;
            }
        },

        /*
         * 保存枠へ現在の設定を保存
         */
        saveSettingSlot: function (slotIndex) {
            this.syncCurrentSettingsFromUI();

            var nameInput =
                document.getElementById('FtHoFMySettingName' + slotIndex);

            var settingName =
                nameInput && nameInput.value.trim() ?
                    nameInput.value.trim() :
                    '設定' + (slotIndex + 1);

            var settingData = this.getCurrentSettingData();
            settingData.name = settingName;

            this.mySettings[slotIndex] = settingData;

            if (typeof Game.WriteSave === 'function') {
                Game.WriteSave();
            }

            Game.Notify(
                'マイセッティング',
                '設定' + (slotIndex + 1) + 'に保存しました。',
                [16, 5],
                3
            );

            this.updateOptionsMenu();
        },

        /*
         * 保存した設定を現在のプランナーへ適用
         */
        applySettingData: function (data) {
            if (!data) return false;

            if (data.settings) {
                for (var settingKey in this.settings) {
                    if (this.settings.hasOwnProperty(settingKey) && data.settings.hasOwnProperty(settingKey)) {
                        this.settings[settingKey] = !!data.settings[settingKey];
                    }
                }
            }

            if (data.highlightSettings) {
                for (var highlightKey in this.highlightSettings) {
                    if (this.highlightSettings.hasOwnProperty(highlightKey) && data.highlightSettings.hasOwnProperty(highlightKey)) {
                        this.highlightSettings[highlightKey] = !!data.highlightSettings[highlightKey];
                    }
                }
            }

            if (typeof data.comboCrossSeason === 'boolean') {
                this.comboCrossSeason = data.comboCrossSeason;
            }

            if (Array.isArray(data.comboSettings)) {
                for (var comboIndex = 0; comboIndex < 4; comboIndex++) {
                    if (!data.comboSettings[comboIndex]) continue;
                    this.comboSettings[comboIndex].effect = data.comboSettings[comboIndex].effect || '';
                    this.comboSettings[comboIndex].gc = Math.max(0, Math.min(10, parseInt(data.comboSettings[comboIndex].gc, 10) || 0));
                    this.comboSettings[comboIndex].mode =
                        data.comboSettings[comboIndex].mode === 'lte' || data.comboSettings[comboIndex].mode === 'eq' ?
                            data.comboSettings[comboIndex].mode : 'gte';
                }
            }

            if (typeof data.forecastCount === 'number') {
                this.forecastCount = Math.max(1, Math.min(500, Math.floor(data.forecastCount)));
            }

            if (typeof data.isOpen === 'boolean') {
                this.isOpen = data.isOpen;
            }

            if (typeof data.settingsOpen === 'boolean') {
                this.settingsOpen = data.settingsOpen;
            }

            if (typeof data.comboOpen === 'boolean') {
                this.comboOpen = data.comboOpen;
            }

            if (typeof data.highlightOpen === 'boolean') {
                this.highlightOpen = data.highlightOpen;
            }

            return true;
        },

        /*
         * Cookie Clickerのセーブデータへ保存する文字列を作る
         */
        getModSaveData: function () {
            return JSON.stringify({
                version: 1,
                mySettings: this.mySettings,
                autoLoadSlot: this.autoLoadSlot
            });
        },

        /*
         * Cookie Clickerのセーブデータから復元
         */
        loadModSaveData: function (str) {
            if (!str) return;

            try {
                var data = JSON.parse(str);

                if (Array.isArray(data.mySettings)) {
                    this.mySettings = [
                        data.mySettings[0] || null,
                        data.mySettings[1] || null,
                        data.mySettings[2] || null
                    ];
                }

                this.autoLoadSlot =
                    data.autoLoadSlot === 0 ||
                    data.autoLoadSlot === 1 ||
                    data.autoLoadSlot === 2 ?
                        data.autoLoadSlot : -1;

                if (this.autoLoadSlot >= 0 && this.mySettings[this.autoLoadSlot]) {
                    this.applySettingData(this.mySettings[this.autoLoadSlot]);
                }
            } catch (error) {
                console.warn('[FtHoF Planner] マイセッティングの読み込みに失敗しました。', error);
            }
        },


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
         *
         * v2.058 の FtHoF に合わせ、設定した倍率は「基本15%」へ
         * 適用し、その後に画面上のGC/WCによる +15%/個を加算する。
         *
         * Supreme Intellect + Reality Bending の組み合わせは
         * 本家FtHoF Planner v6系の設定と同じく 1.11倍として扱う。
         */
        getFailChance: function () {

            var base = 0.15;

            if (this.settings.supremeIntellect && this.settings.realityBending) {
                base *= 1.11;
            } else if (this.settings.supremeIntellect) {
                base *= 1.10;
            } else if (this.settings.realityBending) {
                base *= 1.01;
            }

            if (this.settings.diminishIneptitude) {
                base *= 0.1;
            }

            if (this.settings.diminishIneptitudeBackfire) {
                base *= 5;
            }

            var goldenCount = 0;

            if (Game.shimmerTypes && Game.shimmerTypes['golden']) {
                goldenCount = Game.shimmerTypes['golden'].n || 0;
            }

            return base + 0.15 * goldenCount;
        },


        /*
         * 設定に表示する「基本バックファイア率」
         * 画面上GC/WCの加算分を含まない。
         */
        getBaseFailChance: function () {

            var base = 0.15;

            if (this.settings.supremeIntellect && this.settings.realityBending) {
                base *= 1.11;
            } else if (this.settings.supremeIntellect) {
                base *= 1.10;
            } else if (this.settings.realityBending) {
                base *= 1.01;
            }

            if (this.settings.diminishIneptitude) {
                base *= 0.1;
            }

            if (this.settings.diminishIneptitudeBackfire) {
                base *= 5;
            }

            return base;
        },


        /*
         * 画面上のGC/WC数
         */
        getGoldenCount: function () {
            if (Game.shimmerTypes && Game.shimmerTypes['golden']) {
                return Game.shimmerTypes['golden'].n || 0;
            }
            return 0;
        },


        /*
         * 本家 FtHoF Planner v6b 日本語版に合わせた表示名
         * 内部処理では英語名を維持し、表示時だけ日本語化する。
         */
        translateEffect: function (effect) {

            var dict = {
                'Frenzy': 'フィーバー',
                'Lucky': 'ラッキー！',
                'Click Frenzy': 'クリックフィーバー',
                'Cookie Storm': 'クッキー乱舞',
                'Building Special': '施設特殊効果',
                'Cookie Storm Drop': 'クッキー乱舞の雫',
                'Free Sugar Lump': '無料の砂糖玉',
                'Clot': '障害発生',
                'Ruin Cookies': '台無し！',
                'Cursed Finger': '呪われた指',
                'Elder Frenzy': 'エルダーフィーバー',
                'Blab': 'おしゃべり'
            };

            return dict[effect] || effect;
        },


        /*
         * ハイライト設定された効果が反対側に出た場合の略称
         */
        getHighlightAbbreviation: function (effect) {

            var dict = {
                'Frenzy': 'Fr',
                'Lucky': 'Lu',
                'Click Frenzy': 'Cf',
                'Cookie Storm': '乱舞',
                'Building Special': 'Bs',
                'Cookie Storm Drop': '雫',
                'Free Sugar Lump': '砂糖',
                'Clot': '停滞',
                'Ruin Cookies': '台無',
                'Cursed Finger': '呪指',
                'Elder Frenzy': 'Ef',
                'Blab': '喋る'
            };

            return dict[effect] || '';
        },


        /*
         * 失敗GC数
         * 0未満にはならない。
         */
        getFailureGcCount: function (forecast) {
            return Math.max(
                0,
                Math.ceil(
                    (1 - forecast.failChance - forecast.failRoll) / 0.15
                )
            );
        },


        /*
         * コンボの失敗GC数条件
         */
        comboGcMatches: function (gc, setting) {
            if (setting.mode === 'gte') {
                return gc >= setting.gc;
            }

            if (setting.mode === 'lte') {
                return gc <= setting.gc;
            }

            return gc === setting.gc;
        },


        /*
         * コンボ検索
         * 選択された効果が「連続した手」に入っている場合だけコンボとする。
         * 1～4個の選択に対応し、順番は問わない。
         * シーズンを跨ぐ設定では、各手でS1/S2のどちらに出てもよい。
         * 通常結果だけでなく、反対結果（略称表示）もコンボ対象にする。
         */
        getComboMatchedCells: function (forecasts) {
            var settings = [];

            for (var settingIndex = 0; settingIndex < this.comboSettings.length; settingIndex++) {
                if (this.comboSettings[settingIndex].effect) {
                    settings.push(this.comboSettings[settingIndex]);
                }
            }

            var matched = {
                season1: {},
                season2: {},
                season1Opposite: {},
                season2Opposite: {},
                next: null
            };

            if (!settings.length) {
                return matched;
            }

            /*
             * 各手について、S1/S2それぞれの通常結果と反対結果を候補にする。
             * 同じ手で2つ以上のコンボパーツを消費することはできない。
             */
            function getCandidates(item, season) {
                var forecast = season === 'season1' ?
                    item.forecast :
                    item.season2Forecast;

                return [
                    {
                        season: season,
                        index: item.hand - 1,
                        effect: forecast.result,
                        gc: this.getFailureGcCount(forecast),
                        opposite: false
                    },
                    {
                        season: season,
                        index: item.hand - 1,
                        effect: forecast.oppositeResult,
                        gc: this.getFailureGcCount(forecast),
                        opposite: true
                    }
                ];
            }

            /*
             * 連続する開始位置を左から探す。
             * 4つ未満しか選択されていない場合は、その個数だけ連続していればよい。
             */
            for (var start = 0; start <= forecasts.length - settings.length; start++) {
                var seasonList = this.comboCrossSeason ?
                    ['season1', 'season2'] :
                    ['season1', 'season2'];

                for (var startSeasonIndex = 0; startSeasonIndex < seasonList.length; startSeasonIndex++) {
                    var startSeason = seasonList[startSeasonIndex];
                    var selected = [];
                    var usedSettings = {};
                    var success = false;

                    function searchConsecutive(offset) {
                        if (offset >= settings.length) {
                            return true;
                        }

                        var item = forecasts[start + offset];
                        var seasons = this.comboCrossSeason ?
                            ['season1', 'season2'] :
                            [startSeason];

                        for (var seasonIndex = 0; seasonIndex < seasons.length; seasonIndex++) {
                            var season = seasons[seasonIndex];
                            var candidates = getCandidates.call(this, item, season);

                            for (var candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
                                var candidate = candidates[candidateIndex];

                                for (var settingIndex = 0; settingIndex < settings.length; settingIndex++) {
                                    if (usedSettings[settingIndex]) continue;

                                    var setting = settings[settingIndex];

                                    if (candidate.effect !== setting.effect) continue;
                                    if (!this.comboGcMatches(candidate.gc, setting)) continue;

                                    usedSettings[settingIndex] = true;
                                    selected.push({
                                        candidate: candidate,
                                        settingIndex: settingIndex
                                    });

                                    if (searchConsecutive.call(this, offset + 1)) {
                                        return true;
                                    }

                                    selected.pop();
                                    usedSettings[settingIndex] = false;
                                }
                            }
                        }

                        return false;
                    }

                    if (searchConsecutive.call(this, 0)) {
                        success = true;
                    }

                    if (success) {
                        for (var selectedIndex = 0; selectedIndex < selected.length; selectedIndex++) {
                            var selectedCandidate = selected[selectedIndex].candidate;
                            var selectedSeason = selectedCandidate.season;
                            var selectedHandIndex = selectedCandidate.index;

                            if (selectedCandidate.opposite) {
                                matched[selectedSeason + 'Opposite'][selectedHandIndex] = true;
                            } else {
                                matched[selectedSeason][selectedHandIndex] = true;
                            }
                        }

                        matched.next = {
                            startHand: start + 1,
                            endHand: start + settings.length,
                            startSeason: selected[0].candidate.season,
                            endSeason: selected[selected.length - 1].candidate.season
                        };

                        return matched;
                    }

                    /*
                     * シーズンを跨がない場合はS1/S2それぞれを調べる。
                     * 跨ぐ場合はstartSeasonの二重探索を避けるためS1開始だけで十分。
                     */
                    if (this.comboCrossSeason) {
                        break;
                    }
                }
            }

            return matched;
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
        forecastAt: function (spellCount, forcedSuccess, season2) {

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
             * 前回の乱数ログを消去
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
                loggedRandom('逆効果判定');


            var success =
                (typeof forcedSuccess === 'boolean') ?
                    forcedSuccess :
                    failRoll < (1 - failChance);


            /*
             * Golden/Wrath Cookie生成時に消費される乱数。
             * 本家Plannerと同じ乱数位置へ進めるために必要。
             */
            loggedRandom('GC/WC生成 1');
            loggedRandom('GC/WC生成 2');


            /*
             * シーズン2（バレンタイン / イースター /
             * ビジネスデー / ハロウィン）は
             * 本家PlannerのOne Change側として扱い、
             * 追加の乱数を1回消費する。
             */
            if (season2) {
                loggedRandom('シーズン2判定');
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
                if (!this.settings.dragonflight) {

                    choices.push(
                        'Click Frenzy'
                    );

                }


                /*
                 * 10% Cookie Storm
                 */
                var stormRoll =
                    loggedRandom(
                        'クッキー乱舞判定'
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
                            '施設特殊効果判定'
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
                        'クッキーストームドロップ判定'
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
                        '無料の砂糖玉判定'
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
                        '呪われた指判定'
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
                        '無料の砂糖玉判定'
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
                        'ブラブ判定'
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
             * 通常予測では、反対側の結果も同じspellCountで計算する。
             * forcedSuccessを指定した再帰呼び出しでは再計算しない。
             */
            var oppositeResult = null;

            if (typeof forcedSuccess !== 'boolean') {
                oppositeResult =
                    this.forecastAt(
                        spellCount,
                        !success,
                        season2
                    ).result;
            }





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

                oppositeResult: oppositeResult,

                choices: choices,

                randomLog: randomLog.slice()

            };
        },


        /*
         * 次のFtHoFを予測
         */
        forecastNext: function () {
            var M = this.getGrimoire();
            if (!M) return { result: 'Grimoire unavailable' };
            var spell = M.spells['hand of fate'];
            if (!spell) return { result: 'FtHoF unavailable' };
            return this.forecastAt(M.spellsCastTotal);
        },


        /*
         * 次の10手を予測
         * 内部RNGは現在のspellsCastTotalから開始。
         * 表示上の呪文総回数は1手目を現在値+1とする。
         */
        forecastMany: function (count) {
            var M = this.getGrimoire();
            if (!M) return [];
            var startCount = M.spellsCastTotal;
            var forecasts = [];
            for (var i = 0; i < count; i++) {
                forecasts.push({
                    hand: i + 1,
                    displaySpellCount: startCount + i + 1,
                    forecast: this.forecastAt(startCount + i),
                    season2Forecast: this.forecastAt(startCount + i, undefined, true)
                });
            }
            return forecasts;
        },


        /*
         * Options更新
         */
        updateOptionsMenu: function (force) {

            var menu =
                document.getElementById('menu');

            if (!menu) return;


            /*
             * テキストボックス等を入力中は、5秒更新でPlanner全体を
             * 再構築しない。再構築すると入力欄のフォーカスが外れ、
             * スマホ・タブレットの画面内キーボードも閉じてしまうため。
             */
            var activeElement = document.activeElement;
            var plannerElement =
                document.getElementById('FtHoFPlannerOptions');

            if (
                !force &&
                plannerElement &&
                activeElement &&
                plannerElement.contains(activeElement) &&
                (
                    activeElement.tagName === 'INPUT' ||
                    activeElement.tagName === 'SELECT' ||
                    activeElement.tagName === 'TEXTAREA'
                )
            ) {
                return;
            }


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
             * 設定状態を保存
             */
            var oldSettings = document.getElementById('FtHoFPlannerSettingsBody');
            if (oldSettings) {
                var si = document.getElementById('FtHoFSettingSI');
                var rb = document.getElementById('FtHoFSettingRB');
                var di = document.getElementById('FtHoFSettingDI');
                var diBackfire = document.getElementById('FtHoFSettingDIBackfire');
                var df = document.getElementById('FtHoFSettingDragonflight');

                if (si) this.settings.supremeIntellect = si.checked;
                if (rb) this.settings.realityBending = rb.checked;
                if (di) this.settings.diminishIneptitude = di.checked;
                if (diBackfire) this.settings.diminishIneptitudeBackfire = diBackfire.checked;
                if (df) this.settings.dragonflight = df.checked;

                this.settingsOpen = oldSettings.style.display !== 'none';

                var oldForecastCount =
                    document.getElementById('FtHoFForecastCount');

                if (oldForecastCount) {
                    var parsedForecastCount =
                        parseInt(oldForecastCount.value, 10);

                    this.forecastCount =
                        isNaN(parsedForecastCount) ?
                            10 :
                            Math.max(1, Math.min(500, parsedForecastCount));
                }
            }

            /*
             * ハイライト設定のチェック状態を保存
             */
            var highlightEffects = [
                'Frenzy',
                'Lucky',
                'Click Frenzy',
                'Cookie Storm',
                'Building Special',
                'Cookie Storm Drop',
                'Free Sugar Lump',
                'Clot',
                'Ruin Cookies',
                'Cursed Finger',
                'Elder Frenzy',
                'Blab'
            ];

            for (var oldHighlightIndex = 0; oldHighlightIndex < highlightEffects.length; oldHighlightIndex++) {
                var oldHighlightEffect = highlightEffects[oldHighlightIndex];
                var oldHighlightId = 'FtHoFHighlight_' + oldHighlightEffect.replace(/[^a-zA-Z0-9]/g, '_');
                var oldHighlightCheckbox = document.getElementById(oldHighlightId);

                if (oldHighlightCheckbox) {
                    this.highlightSettings[oldHighlightEffect] = oldHighlightCheckbox.checked;
                }
            }

            /*
             * コンボ検索設定の保存
             */
            var oldComboBody =
                document.getElementById('FtHoFPlannerComboBody');

            if (oldComboBody) {
                var oldComboCrossSeason =
                    document.getElementById('FtHoFComboCrossSeason');

                if (oldComboCrossSeason) {
                    this.comboCrossSeason =
                        oldComboCrossSeason.checked;
                }

                for (var oldComboIndex = 0; oldComboIndex < 4; oldComboIndex++) {
                    var oldEffect =
                        document.getElementById('FtHoFComboEffect' + oldComboIndex);
                    var oldGc =
                        document.getElementById('FtHoFComboGc' + oldComboIndex);
                    var oldMode =
                        document.getElementById('FtHoFComboMode' + oldComboIndex);

                    if (oldEffect) {
                        this.comboSettings[oldComboIndex].effect =
                            oldEffect.value;
                    }

                    if (oldGc) {
                        var parsedGc =
                            parseInt(oldGc.value, 10);

                        this.comboSettings[oldComboIndex].gc =
                            isNaN(parsedGc) ?
                                0 :
                                Math.max(0, Math.min(10, parsedGc));
                    }

                    if (oldMode) {
                        this.comboSettings[oldComboIndex].mode =
                            oldMode.value;
                    }
                }

                this.comboOpen =
                    oldComboBody.style.display !== 'none';
            }


            /*
             * スクロール位置保存
             */
            var scrollTop =
                menu.scrollTop;


            /*
             * 古いPlannerの詳細表示状態を保存
             * Game.UpdateMenuは定期的にOptionsを再構築するため、
             * 開いている乱数詳細を再構築後も復元する。
             */
            var old =
                document.getElementById(
                    'FtHoFPlannerOptions'
                );

            if (old) {
                for (var oldIndex = 0; oldIndex < this.forecastCount; oldIndex++) {
                    var oldDetail =
                        document.getElementById(
                            'FtHoFRandomRow' + oldIndex
                        );

                    this.expandedRows[oldIndex] = !!(
                        oldDetail &&
                        oldDetail.style.display !== 'none'
                    );
                }

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
                this.forecastMany(this.forecastCount);


            /*
             * 選択された効果の次回出現位置を計算
             * シーズン1・シーズン2の両方を対象にする。
             */
            var highlightNext = {};

            for (var highlightEffect in this.highlightSettings) {
                if (!this.highlightSettings.hasOwnProperty(highlightEffect)) continue;
                if (!this.highlightSettings[highlightEffect]) continue;

                highlightNext[highlightEffect] = {
                    season1: null,
                    season2: null
                };

                for (var highlightIndex = 0; highlightIndex < forecasts.length; highlightIndex++) {
                    if (highlightNext[highlightEffect].season1 === null &&
                        (forecasts[highlightIndex].forecast.result === highlightEffect ||
                         forecasts[highlightIndex].forecast.oppositeResult === highlightEffect)) {
                        highlightNext[highlightEffect].season1 = forecasts[highlightIndex].hand;
                    }
                    if (highlightNext[highlightEffect].season2 === null &&
                        (forecasts[highlightIndex].season2Forecast.result === highlightEffect ||
                         forecasts[highlightIndex].season2Forecast.oppositeResult === highlightEffect)) {
                        highlightNext[highlightEffect].season2 = forecasts[highlightIndex].hand;
                    }
                    if (highlightNext[highlightEffect].season1 !== null &&
                        highlightNext[highlightEffect].season2 !== null) {
                        break;
                    }
                }
            }

            /*
             * コンボ検索結果
             */
            var comboMatchedCells =
                this.getComboMatchedCells(forecasts);

            var comboNextText =
                this.forecastCount + '手以内にコンボなし';

            if (comboMatchedCells.next) {
                comboNextText =
                    '開始：' + comboMatchedCells.next.startHand + '手目' +
                    ' ～ ' + comboMatchedCells.next.endHand + '手目';
            }


            /*
             * 10手一覧HTML
             */
            var rowsHTML = '';

            for (
                var i = 0;
                i < forecasts.length;
                i++
            ) {

                var item = forecasts[i];
                var f = item.forecast;

                var mainRandom =
                    f.randomLog && f.randomLog.length ?
                        f.randomLog[0].value :
                        0;

                var season1Forecast =
                    f;

                var season2Forecast =
                    item.season2Forecast;

                var season1Effect =
                    this.translateEffect(season1Forecast.result);

                var season2Effect =
                    this.translateEffect(season2Forecast.result);

                var season1OppositeAbbreviationHTML = '';

                if (this.highlightSettings[season1Forecast.oppositeResult] || comboMatchedCells.season1Opposite[i]) {
                    var season1OppositeAbbreviation =
                        this.getHighlightAbbreviation(
                            season1Forecast.oppositeResult
                        );
                    if (season1OppositeAbbreviation) {
                        season1OppositeAbbreviationHTML =
                            '<span style="background:' +
                            (comboMatchedCells.season1Opposite[i] ? '#d98bb3' : '#e6d96a') +
                            ';">' +
                            '(' + season1OppositeAbbreviation + ')' +
                            '</span>';
                    }
                }

                var season2OppositeAbbreviationHTML = '';

                if (this.highlightSettings[season2Forecast.oppositeResult] || comboMatchedCells.season2Opposite[i]) {
                    var season2OppositeAbbreviation =
                        this.getHighlightAbbreviation(
                            season2Forecast.oppositeResult
                        );
                    if (season2OppositeAbbreviation) {
                        season2OppositeAbbreviationHTML =
                            '<span style="background:' +
                            (comboMatchedCells.season2Opposite[i] ? '#d98bb3' : '#e6d96a') +
                            ';">' +
                            '(' + season2OppositeAbbreviation + ')' +
                            '</span>';
                    }
                }

                var season1HighlightStyle =
                    this.highlightSettings[season1Forecast.result] ?
                        'background:#e6d96a;' :
                        '';

                var season2HighlightStyle =
                    this.highlightSettings[season2Forecast.result] ?
                        'background:#e6d96a;' :
                        '';

                /*
                 * コンボ検索はハイライト設定より優先。
                 */
                if (comboMatchedCells.season1[i] || comboMatchedCells.season1Opposite[i]) {
                    season1HighlightStyle =
                        'background:#d98bb3;';
                }

                if (comboMatchedCells.season2[i] || comboMatchedCells.season2Opposite[i]) {
                    season2HighlightStyle =
                        'background:#d98bb3;';
                }

                var season1ColorStyle =
                    season1Forecast.success ?
                        'color:#2e7d32;' :
                        'color:#c62828;';

                var season2ColorStyle =
                    season2Forecast.success ?
                        'color:#2e7d32;' :
                        'color:#c62828;';

                var failureGcCount =
                    Math.max(
                        0,
                        Math.ceil(
                            (1 - f.failChance - f.failRoll) / 0.15
                        )
                    );

                var randomDisplay =
                    mainRandom.toFixed(4) +
                    '(' + failureGcCount + ')';

                /*
                 * 略称は「反対側の結果」なので、通常結果とは色を反転する。
                 */
                var season1OppositeColorStyle =
                    season1Forecast.success ?
                        'color:#c62828;' :
                        'color:#2e7d32;';

                var season2OppositeColorStyle =
                    season2Forecast.success ?
                        'color:#c62828;' :
                        'color:#2e7d32;';

                var detailHTML =
                    '<div style="margin:3px 0;">' +
                        '<b>シーズン1の反対側：</b> ' +
                        '<span style="' + season1OppositeColorStyle + 'font-weight:bold;">' +
                        this.translateEffect(season1Forecast.oppositeResult) +
                        '</span>' +
                    '</div>' +
                    '<div style="margin:3px 0;">' +
                        '<b>シーズン2の反対側：</b> ' +
                        '<span style="' + season2OppositeColorStyle + 'font-weight:bold;">' +
                        this.translateEffect(season2Forecast.oppositeResult) +
                        '</span>' +
                    '</div>';

                rowsHTML +=
                    '<tr style="cursor:pointer;" data-fthof-row="' + i + '">' +
                        '<td style="padding:5px 7px;white-space:nowrap;">' +
                            item.hand + '手目 / ' +
                            item.displaySpellCount + '回' +
                        '</td>' +
                        '<td style="padding:5px 7px;font-family:monospace;white-space:nowrap;">' +
                            randomDisplay +
                        '</td>' +
                        '<td style="padding:5px 10px;min-width:165px;white-space:nowrap;' + season1HighlightStyle + season1ColorStyle + '">' +
                            '<b>' + season1Effect + season1OppositeAbbreviationHTML + '</b>' +
                        '</td>' +
                        '<td style="padding:5px 10px;min-width:165px;white-space:nowrap;' + season2HighlightStyle + season2ColorStyle + '">' +
                            '<b>' + season2Effect + season2OppositeAbbreviationHTML + '</b>' +
                        '</td>' +
                    '</tr>' +
                    '<tr id="FtHoFRandomRow' + i + '" style="display:' + (this.expandedRows[i] ? '' : 'none') + ';">' +
                        '<td colspan="4" style="padding:4px 7px 8px 20px;">' +
                            '<div style="font-size:12px;font-family:monospace;">' +
                                detailHTML +
                            '</div>' +
                        '</td>' +
                    '</tr>';
            }

            if (!rowsHTML) {
                rowsHTML =
                    '<tr><td colspan="4">予測データなし</td></tr>';
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

                '<div class="listing" style="margin-top:4px;">' +
                    '<div id="FtHoFPlannerSettingsTitle" style="cursor:pointer;font-weight:bold;">' +
                        'プランナー設定 ' +
                        '<span id="FtHoFPlannerSettingsToggle">' +
                            (this.settingsOpen ? '−' : '+') +
                        '</span>' +
                    '</div>' +
                    '<div id="FtHoFPlannerSettingsBody" style="display:' +
                        (this.settingsOpen ? '' : 'none') +
                    ';margin-top:8px;">' +
                        '<label style="display:block;margin:4px 0;">' +
                            '予測手数：' +
                            '<input type="number" id="FtHoFForecastCount" min="1" max="500" step="1" value="' +
                            this.forecastCount +
                            '" style="width:65px;margin-left:4px;">' +
                            '（1～500）' +
                        '</label>' +
                        '<label style="display:block;margin:4px 0;">' +
                            '<input type="checkbox" id="FtHoFSettingSI" ' +
                            (this.settings.supremeIntellect ? 'checked' : '') +
                            '> 最高峰の知性（バックファイア率1.1倍）' +
                        '</label>' +
                        '<label style="display:block;margin:4px 0;">' +
                            '<input type="checkbox" id="FtHoFSettingRB" ' +
                            (this.settings.realityBending ? 'checked' : '') +
                            '> 現実の湾曲（バックファイア率1.01倍）' +
                        '</label>' +
                        '<label style="display:block;margin:4px 0;">' +
                            '<input type="checkbox" id="FtHoFSettingDI" ' +
                            (this.settings.diminishIneptitude ? 'checked' : '') +
                            '> 愚劣の減少（バックファイア率0.1倍）' +
                        '</label>' +
                        '<label style="display:block;margin:4px 0;">' +
                            '<input type="checkbox" id="FtHoFSettingDIBackfire" ' +
                            (this.settings.diminishIneptitudeBackfire ? 'checked' : '') +
                            '> 愚劣の増大（バックファイア率5倍）' +
                        '</label>' +
                        '<label style="display:block;margin:4px 0;">' +
                            '<input type="checkbox" id="FtHoFSettingDragonflight" ' +
                            (this.settings.dragonflight ? 'checked' : '') +
                            '> ドラゴンフライト（クリックフィーバーがラッキー等になる）' +
                        '</label>' +
                        '<div style="margin-top:8px;font-size:12px;opacity:0.85;">' +
                            '基本バックファイア率：<b>' +
                            (this.getBaseFailChance() * 100).toFixed(2) +
                            '%</b><br>' +
                            '画面上のGC/WC：<b>' +
                            this.getGoldenCount() +
                            '</b>個 → 現在のバックファイア率：<b>' +
                            (this.getFailChance() * 100).toFixed(2) +
                            '%</b>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="listing" style="margin-top:4px;">' +
                    '<div style="font-weight:bold;">マイセッティング</div>' +
                    '<div style="font-size:12px;opacity:0.85;margin:6px 0;">' +
                        '現在の設定を3個まで保存できます。自動ロードは1個だけ選択できます。' +
                    '</div>' +
                    (function () {
                        var html = '';
                        for (var slotIndex = 0; slotIndex < 3; slotIndex++) {
                            html +=
                                '<div style="display:flex;align-items:center;gap:5px;margin:6px 0;flex-wrap:wrap;">' +
                                    '<b style="min-width:42px;">設定' + (slotIndex + 1) + '</b>' +
                                    '<input type="text" id="FtHoFMySettingName' + slotIndex + '" value="' +
                                        this.escapeHtml(
                                            this.mySettings[slotIndex] && this.mySettings[slotIndex].name ?
                                                this.mySettings[slotIndex].name :
                                                '設定' + (slotIndex + 1)
                                        ) +
                                        '" placeholder="設定名" maxlength="30" style="width:120px;">' +
                                    '<button class="smallFancyButton" id="FtHoFMySettingSave' + slotIndex + '">保存</button>' +
                                    '<label style="margin-left:4px;">' +
                                        '<input type="checkbox" id="FtHoFMySettingAuto' + slotIndex + '" ' +
                                            (this.autoLoadSlot === slotIndex ? 'checked' : '') +
                                        '>' +
                                        ' 自動ロード' +
                                    '</label>' +
                                    '<span style="font-size:12px;opacity:0.75;">' +
                                        (this.mySettings[slotIndex] ?
                                            (this.escapeHtml(this.mySettings[slotIndex].name || '設定' + (slotIndex + 1)) + '：保存済み') :
                                            '未保存') +
                                    '</span>' +
                                '</div>';
                        }
                        return html;
                    }).call(this) +
                '</div>' +

                '<div class="listing" style="margin-top:4px;">' +
                    '<div id="FtHoFPlannerComboTitle" style="cursor:pointer;font-weight:bold;">' +
                        'コンボ検索 ' +
                        '<span id="FtHoFPlannerComboToggle">' +
                            (this.comboOpen ? '−' : '+') +
                        '</span>' +
                    '</div>' +
                    '<div id="FtHoFPlannerComboBody" style="display:' +
                        (this.comboOpen ? '' : 'none') +
                    ';margin-top:8px;">' +
                        '<label style="display:block;margin:4px 0;">' +
                            '<input type="checkbox" id="FtHoFComboCrossSeason" ' +
                            (this.comboCrossSeason ? 'checked' : '') +
                            '> シーズンを跨いでもよい' +
                        '</label>' +
                        '<div style="font-size:12px;opacity:0.85;margin-bottom:6px;">' +
                            '選択した効果が連続した手に入っていれば赤紫でハイライトします。順番は問いません。選択は1～4個でOKです。' +
                            '<br>次回：<b>' + comboNextText + '</b>' +
                        '</div>' +
                        (function () {
                            var html = '';
                            var effects = [
                                ['', 'なし'],
                                ['Frenzy', 'フィーバー'],
                                ['Lucky', 'ラッキー！'],
                                ['Click Frenzy', 'クリックフィーバー'],
                                ['Cookie Storm', 'クッキー乱舞'],
                                ['Building Special', '施設特殊効果'],
                                ['Cookie Storm Drop', 'クッキー乱舞の雫'],
                                ['Free Sugar Lump', '無料の砂糖玉'],
                                ['Clot', '障害発生'],
                                ['Ruin Cookies', '台無し！'],
                                ['Cursed Finger', '呪われた指'],
                                ['Elder Frenzy', 'エルダーフィーバー'],
                                ['Blab', 'おしゃべり']
                            ];

                            for (var comboIndex = 0; comboIndex < 4; comboIndex++) {
                                var comboSetting =
                                    this.comboSettings[comboIndex];

                                html +=
                                    '<div style="display:flex;align-items:center;gap:4px;margin:5px 0;">' +
                                        '<input type="number" id="FtHoFComboGc' + comboIndex + '" min="0" max="10" step="1" value="' +
                                            comboSetting.gc +
                                        '" style="width:45px;">' +
                                        '<select id="FtHoFComboMode' + comboIndex + '" style="max-width:105px;">' +
                                            '<option value="gte" ' +
                                                (comboSetting.mode === 'gte' ? 'selected' : '') +
                                            '>以上</option>' +
                                            '<option value="lte" ' +
                                                (comboSetting.mode === 'lte' ? 'selected' : '') +
                                            '>以下</option>' +
                                            '<option value="eq" ' +
                                                (comboSetting.mode === 'eq' ? 'selected' : '') +
                                            '>それ以外許さない</option>' +
                                        '</select>' +
                                        '<select id="FtHoFComboEffect' + comboIndex + '" style="flex:1;">';

                                for (var comboEffectIndex = 0; comboEffectIndex < effects.length; comboEffectIndex++) {
                                    html +=
                                        '<option value="' + effects[comboEffectIndex][0] + '" ' +
                                            (comboSetting.effect === effects[comboEffectIndex][0] ? 'selected' : '') +
                                        '>' +
                                            effects[comboEffectIndex][1] +
                                        '</option>';
                                }

                                html +=
                                        '</select>' +
                                    '</div>';
                            }

                            return html;
                        }).call(this) +
                    '</div>' +
                '</div>' +

                '<div class="listing" style="margin-top:4px;">' +
                    '<div id="FtHoFPlannerHighlightTitle" style="cursor:pointer;font-weight:bold;">' +
                        'ハイライト設定 ' +
                        '<span id="FtHoFPlannerHighlightToggle">' +
                            (this.highlightOpen ? '−' : '+') +
                        '</span>' +
                    '</div>' +
                    '<div id="FtHoFPlannerHighlightBody" style="display:' +
                        (this.highlightOpen ? '' : 'none') +
                    ';margin-top:8px;">' +
                        '<div style="font-size:12px;opacity:0.85;margin-bottom:6px;">' +
                            '選択した効果を表の中で黄色にハイライトします。通常結果と反対結果（略称表示）の両方を次回出現の対象にします。' +
                        '</div>' +
                        (function () {
                            var html = '';
                            var effects = [
                                'Frenzy',
                                'Lucky',
                                'Click Frenzy',
                                'Cookie Storm',
                                'Building Special',
                                'Cookie Storm Drop',
                                'Free Sugar Lump',
                                'Clot',
                                'Ruin Cookies',
                                'Cursed Finger',
                                'Elder Frenzy',
                                'Blab'
                            ];

                            for (var highlightIndex = 0; highlightIndex < effects.length; highlightIndex++) {
                                var effect = effects[highlightIndex];
                                var id = 'FtHoFHighlight_' + effect.replace(/[^a-zA-Z0-9]/g, '_');
                                var nextText =
                                    highlightNext[effect] ?
                                        ((highlightNext[effect].season1 !== null ?
                                            'S1：' + highlightNext[effect].season1 + '手目' :
                                            'S1：10手以内なし') +
                                         ' / ' +
                                         (highlightNext[effect].season2 !== null ?
                                            'S2：' + highlightNext[effect].season2 + '手目' :
                                            'S2：10手以内なし')) :
                                        'S1：10手以内なし / S2：10手以内なし';

                                html +=
                                    '<label style="display:flex;align-items:center;margin:4px 0;">' +
                                        '<input type="checkbox" id="' + id + '" ' +
                                            (this.highlightSettings[effect] ? 'checked' : '') +
                                        '>' +
                                        '<span style="margin-left:4px;">' +
                                            this.translateEffect(effect) +
                                        '</span>' +
                                        '<span style="margin-left:auto;font-size:12px;opacity:0.8;">' +
                                            '次回：' + nextText +
                                        '</span>' +
                                    '</label>';
                            }

                            return html;
                        }).call(this) +
                    '</div>' +
                '</div>' +

                '<div id="FtHoFPlannerBody" ' +
                    'style="display:' +
                        (this.isOpen ? '' : 'none') +
                    ';">' +

                    '<div class="listing">' +
                        '<b>抗えぬ運命の手</b>' +
                        '<br><br>' +
                        '<b>総スペル回数：</b>' +
                        spellsCast +
                        '<br>' +
                        '<b>シード：</b>' +
                        seed +
                    '</div>' +

                    '<div class="listing">' +
                        '<b>次の' + this.forecastCount + '手</b>' +
                        '<br><br>' +
                        '<table style="width:auto;border-collapse:collapse;font-size:13px;">' +
                            '<thead>' +
                                '<tr>' +
                                    '<th style="text-align:left;padding:5px 7px;">手数 / 呪文総回数</th>' +
                                    '<th style="text-align:left;padding:5px 7px;white-space:nowrap;">乱数</th>' +
                                    '<th style="text-align:left;padding:5px 10px;min-width:165px;white-space:nowrap;">シーズン1</th>' +
                                    '<th style="text-align:left;padding:5px 10px;min-width:165px;white-space:nowrap;">シーズン2</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody>' +
                                rowsHTML +
                            '</tbody>' +
                        '</table>' +
                        '<br>' +
                        '<small style="opacity:0.7;">行をタップすると、シーズン1・シーズン2それぞれの反対側の結果を表示します。</small>' +
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
             * プランナー設定の開閉
             */
            var settingsTitle = document.getElementById('FtHoFPlannerSettingsTitle');
            var settingsBody = document.getElementById('FtHoFPlannerSettingsBody');
            var settingsToggle = document.getElementById('FtHoFPlannerSettingsToggle');

            if (settingsTitle && settingsBody && settingsToggle) {
                settingsTitle.onclick = function () {
                    if (settingsBody.style.display === 'none') {
                        settingsBody.style.display = '';
                        settingsToggle.textContent = '−';
                        FtHoFPlanner.settingsOpen = true;
                    } else {
                        settingsBody.style.display = 'none';
                        settingsToggle.textContent = '+';
                        FtHoFPlanner.settingsOpen = false;
                    }
                };
            }

            /*
             * マイセッティングの保存・自動ロード設定
             */
            for (var mySettingIndex = 0; mySettingIndex < 3; mySettingIndex++) {
                (function (index) {
                    var saveButton = document.getElementById('FtHoFMySettingSave' + index);
                    var autoCheckbox = document.getElementById('FtHoFMySettingAuto' + index);

                    if (saveButton) {
                        saveButton.onclick = function () {
                            FtHoFPlanner.saveSettingSlot(index);
                        };
                    }

                    if (autoCheckbox) {
                        autoCheckbox.onchange = function () {
                            if (autoCheckbox.checked) {
                                FtHoFPlanner.autoLoadSlot = index;
                            } else if (FtHoFPlanner.autoLoadSlot === index) {
                                FtHoFPlanner.autoLoadSlot = -1;
                            }

                            if (typeof Game.WriteSave === 'function') {
                                Game.WriteSave();
                            }

                            FtHoFPlanner.updateOptionsMenu(true);
                        };
                    }
                })(mySettingIndex);
            }

            /*
             * コンボ検索の開閉
             */
            var comboTitle =
                document.getElementById('FtHoFPlannerComboTitle');

            var comboBody =
                document.getElementById('FtHoFPlannerComboBody');

            var comboToggle =
                document.getElementById('FtHoFPlannerComboToggle');

            if (comboTitle && comboBody && comboToggle) {
                comboTitle.onclick = function () {
                    if (comboBody.style.display === 'none') {
                        comboBody.style.display = '';
                        comboToggle.textContent = '−';
                        FtHoFPlanner.comboOpen = true;
                    } else {
                        comboBody.style.display = 'none';
                        comboToggle.textContent = '+';
                        FtHoFPlanner.comboOpen = false;
                    }
                };
            }

            var comboCrossSeasonCheckbox =
                document.getElementById('FtHoFComboCrossSeason');

            if (comboCrossSeasonCheckbox) {
                comboCrossSeasonCheckbox.onchange = function () {
                    FtHoFPlanner.comboCrossSeason =
                        comboCrossSeasonCheckbox.checked;
                    FtHoFPlanner.updateOptionsMenu(true);
                };
            }

            for (var comboSettingIndex = 0; comboSettingIndex < 4; comboSettingIndex++) {
                (function (index) {
                    var effectSelect =
                        document.getElementById('FtHoFComboEffect' + index);

                    var gcInput =
                        document.getElementById('FtHoFComboGc' + index);

                    var modeSelect =
                        document.getElementById('FtHoFComboMode' + index);

                    function updateComboSetting() {
                        var parsedGc =
                            parseInt(gcInput.value, 10);

                        if (isNaN(parsedGc)) parsedGc = 0;

                        parsedGc =
                            Math.max(0, Math.min(10, parsedGc));

                        gcInput.value = parsedGc;

                        FtHoFPlanner.comboSettings[index].effect =
                            effectSelect.value;

                        FtHoFPlanner.comboSettings[index].gc =
                            parsedGc;

                        FtHoFPlanner.comboSettings[index].mode =
                            modeSelect.value;

                        FtHoFPlanner.updateOptionsMenu(true);
                    }

                    if (effectSelect) {
                        effectSelect.onchange =
                            updateComboSetting;
                    }

                    if (gcInput) {
                        gcInput.onchange =
                            updateComboSetting;
                    }

                    if (modeSelect) {
                        modeSelect.onchange =
                            updateComboSetting;
                    }
                })(comboSettingIndex);
            }

            /*
             * ハイライト設定の開閉
             */
            var highlightTitle = document.getElementById('FtHoFPlannerHighlightTitle');
            var highlightBody = document.getElementById('FtHoFPlannerHighlightBody');
            var highlightToggle = document.getElementById('FtHoFPlannerHighlightToggle');

            if (highlightTitle && highlightBody && highlightToggle) {
                highlightTitle.onclick = function () {
                    if (highlightBody.style.display === 'none') {
                        highlightBody.style.display = '';
                        highlightToggle.textContent = '−';
                    } else {
                        highlightBody.style.display = 'none';
                        highlightToggle.textContent = '+';
                        FtHoFPlanner.highlightOpen = false;
                    }

                    if (highlightBody.style.display !== 'none') {
                        FtHoFPlanner.highlightOpen = true;
                    }
                };
            }

            /*
             * ハイライト設定変更時は予測を即時更新
             */
            for (var highlightSettingIndex = 0; highlightSettingIndex < highlightEffects.length; highlightSettingIndex++) {
                (function (effect) {
                    var id = 'FtHoFHighlight_' + effect.replace(/[^a-zA-Z0-9]/g, '_');
                    var checkbox = document.getElementById(id);

                    if (!checkbox) return;

                    checkbox.onchange = function () {
                        FtHoFPlanner.highlightSettings[effect] = checkbox.checked;
                        FtHoFPlanner.updateOptionsMenu(true);
                    };
                })(highlightEffects[highlightSettingIndex]);
            }

            /*
             * 予測手数変更時は予測を即時更新
             */
            var forecastCountInput =
                document.getElementById('FtHoFForecastCount');

            if (forecastCountInput) {
                forecastCountInput.onchange = function () {
                    var parsedForecastCount =
                        parseInt(forecastCountInput.value, 10);

                    if (isNaN(parsedForecastCount)) {
                        parsedForecastCount = 10;
                    }

                    FtHoFPlanner.forecastCount =
                        Math.max(
                            1,
                            Math.min(500, parsedForecastCount)
                        );

                    forecastCountInput.value =
                        FtHoFPlanner.forecastCount;

                    FtHoFPlanner.updateOptionsMenu(true);
                };
            }

            /*
             * バックファイア設定変更時は予測を即時更新
             */
            var settingIds = [
                'FtHoFSettingSI',
                'FtHoFSettingRB',
                'FtHoFSettingDI',
                'FtHoFSettingDIBackfire',
                'FtHoFSettingDragonflight'
            ];

            for (var settingIndex = 0; settingIndex < settingIds.length; settingIndex++) {
                (function (id) {
                    var checkbox = document.getElementById(id);
                    if (!checkbox) return;
                    checkbox.onchange = function () {
                        FtHoFPlanner.settings.supremeIntellect = document.getElementById('FtHoFSettingSI').checked;
                        FtHoFPlanner.settings.realityBending = document.getElementById('FtHoFSettingRB').checked;
                        FtHoFPlanner.settings.diminishIneptitude = document.getElementById('FtHoFSettingDI').checked;
                        FtHoFPlanner.settings.diminishIneptitudeBackfire = document.getElementById('FtHoFSettingDIBackfire').checked;
                        FtHoFPlanner.settings.dragonflight = document.getElementById('FtHoFSettingDragonflight').checked;
                        FtHoFPlanner.updateOptionsMenu(true);
                    };
                })(settingIds[settingIndex]);
            }


            /*
             * 各行のクリックで乱数詳細を開閉
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
                        row.onclick = function () {
                            if (randomRow.style.display === 'none') {
                                randomRow.style.display = '';
                                FtHoFPlanner.expandedRows[index] = true;
                            } else {
                                randomRow.style.display = 'none';
                                FtHoFPlanner.expandedRows[index] = false;
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
     * Cookie Clickerのセーブデータへマイセッティングを保存
     * Game.registerModのsave/loadを使うため、通常のゲームセーブに含まれる。
     */
    Game.registerMod('FtHoF Planner', {
        init: function () {},
        save: function () {
            return FtHoFPlanner.getModSaveData();
        },
        load: function (str) {
            FtHoFPlanner.loadModSaveData(str);
        }
    });


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
             * Plannerの入力欄を操作中は、本体の5秒更新そのものを
             * 一時的に止める。先にoriginalUpdateMenuを実行すると
             * PlannerのDOMが消えて入力内容・フォーカスが失われるため。
             */
            var activeElement = document.activeElement;
            var plannerElement =
                document.getElementById('FtHoFPlannerOptions');

            var plannerInputFocused =
                plannerElement &&
                activeElement &&
                plannerElement.contains(activeElement) &&
                (
                    activeElement.tagName === 'INPUT' ||
                    activeElement.tagName === 'SELECT' ||
                    activeElement.tagName === 'TEXTAREA'
                );

            if (
                Game.onMenu === 'prefs' &&
                plannerInputFocused
            ) {
                return;
            }

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
        'FtHoF Planner v0.1.6',
        'マイセッティング（3枠保存・名前・開閉状態・自動ロード）に対応しました。',
        [16, 5],
        3
    );


    console.log(
        '[FtHoF Planner] loaded'
    );

})();

