UPDATE employees
SET password_hash = 'ebfaa74675ce45cdc019826f14418941$938760bba6dbadccef213f674b02924685ef3073c018a0d78b8b2a74e3742697',
    must_change_password = FALSE
WHERE login = 'admin';
