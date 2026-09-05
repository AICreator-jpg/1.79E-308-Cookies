(function () {
    'use strict';

    // ========================================
    // FtHoF Planner
    // ========================================

    console.log('[FtHoF Planner] Loading...');

    // MOD読み込み確認
    Game.Notify(
        'FtHoF Planner',
        'MODが正常に読み込まれました！',
        [16, 5]
    );

    // ========================================
    // Optionsメニューへの追加
    // ========================================

    Game.customOptionsMenu.push(function () {

        return `
            <div class="listing">
                <a class="option" id="fthof-planner-open">
                    FtHoF Planner
                </a>
                <label>
                    FtHoF Plannerを開きます。
                </label>
            </div>
        `;

    });

    console.log('[FtHoF Planner] Options menu registered.');

})();
