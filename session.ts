// تعريف بسيط بدون أخطاء
declare module 'express-session' {
    export interface SessionData {
        currentUser: any;  // أي نوع من البيانات
    }
}
