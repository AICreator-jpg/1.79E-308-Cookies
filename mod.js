(function () {
    'use strict';

    if (typeof Game === 'undefined') {
        console.error('[FtHoF Planner] Cookie Clickerが見つかりません。');
        return;
    }

    console.log('[FtHoF Planner] Loaded.');

    // ========================================
    // FtHoF Planner
    // ========================================

    Game.registerHook('check', function () {
        // 今は何もしません。
    });

    // Options画面にボタンを追加
    if (typeof Game.registerMod === 'function') {
        console.log('[FtHoF Planner] Game API detected.');
    }

    // Cookie ClickerのOptions画面を拡張
    const originalUpdateMenu = Game.UpdateMenu;

    Game.UpdateMenu = function () {
        originalUpdateMenu.apply(this, arguments);

        if (Game.onMenu === 'prefs') {
            addPlannerButton();
        }
    };

    function addPlannerButton() {
        if (document.getElementById('fthof-planner-button')) {
            return;
        }

        const menu = document.getElementById('menu');

        if (!menu) {
            return;
        }

        const button = document.createElement('div');

        button.id = 'fthof-planner-button';
        button.className = 'option';
        button.textContent = 'FtHoF Planner';

        button.onclick = function () {
            openPlanner();
        };

        menu.appendChild(button);
    }

    // Planner画面
    function openPlanner() {
        alert('FtHoF Planner\n\n現在はテスト画面です。');
    }

})();
