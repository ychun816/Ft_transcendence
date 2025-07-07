;
function isUsernameString(user) {
    return typeof user.username === "string";
}
;
function isPasswordString(user) {
    return typeof user.password === "string";
}
;
function isUsernameAllowed(user) {
    return user.password !== "admin";
}
;
function isPasswordLong(user) {
    return user.password.length >= 5;
}
;
function isAvatarDefined(user) {
    return user.avatar === undefined || user.avatar instanceof File;
}
;
function UserSignUpCheck(user) {
    if (!isUsernameString(user)) {
        alert("Username must be a string");
        return false;
    }
    if (!isPasswordString(user)) {
        alert("Password must be a string");
        return false;
    }
    if (!isUsernameAllowed(user)) {
        alert("Username must not be admin");
        return false;
    }
    if (!isPasswordLong(user)) {
        alert("Password must be at least 5 characters long");
        return false;
    }
    if (!isAvatarDefined(user)) {
        alert("Avatar must be a File ou undefined");
        return false;
    }
    return true;
}
export {};
