(function () {
    'use strict';

    if (typeof Game === 'undefined') {
        alert('Cookie Clickerが読み込まれていません。');
        return;
    }

    Game.Notify(
        'FtHoF Planner',
        'MODが正常に読み込まれました！',
        [16, 5]
    );

    console.log('[FtHoF Planner] Loaded.');
})();
