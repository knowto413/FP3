document.addEventListener('DOMContentLoaded', function() {
    const startExamBtn = document.getElementById('startExamBtn');
    
    if (startExamBtn) {
        startExamBtn.addEventListener('click', function() {
            // 試験開始時の初期化
            sessionStorage.removeItem('examAnswers');
            sessionStorage.removeItem('examStartTime');
            sessionStorage.setItem('examStartTime', Date.now().toString());
            
            // 試験画面に遷移
            window.location.href = 'exam.html';
        });
    }
});