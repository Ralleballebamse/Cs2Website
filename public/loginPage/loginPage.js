
async function main() {

    //Variables
    let createUserUsername = true;
    let createUserPassword = true;
    let createUserSteamUrl = true;
    let loginUserActive = true;
    let createUserActive = false;

    //Buttons
    const createButton = document.getElementById("CreateUser");

    const mainContainer = document.getElementById("main");

    const usernameTextArea = document.getElementById("UsernameTextArea");
    const passwordTextArea = document.getElementById("PasswordTextArea");
    const steamUrlTextArea = document.getElementById("SteamUrlTextArea");
    const usernameField = document.getElementById("UsernameField");
    const passwordField = document.getElementById("PasswordField");
    const steamUrlField = document.getElementById("SteamUrlField");

    const steamUrlfield = document.getElementById("SteamUrlField");
    steamUrlfield.style.display = "none";

    const noUsernameText = document.createElement("h4");
    noUsernameText.textContent = "Username has to have least 6 letters!";
    usernameField.append(noUsernameText);
    noUsernameText.style.display = "none";

    const noPasswordText = document.createElement("h4");
    noPasswordText.textContent = "Password has to have least 6 letters!";
    passwordField.append(noPasswordText);
    noPasswordText.style.display = "none";

    const noSteamUrlText = document.createElement("h4");
    noSteamUrlText.textContent = "SteamUrl has to have least 10 letters!";
    steamUrlField.append(noSteamUrlText);
    noSteamUrlText.style.display = "none";

    const usernameExistsText = document.createElement("h4");
    usernameExistsText.textContent = "Username already exist!";
    mainContainer.append(usernameExistsText);
    usernameExistsText.style.display = "none";

    const incorrectLogin = document.createElement("h4");
    incorrectLogin.textContent = "Incorrect username or password!";
    mainContainer.append(incorrectLogin);
    incorrectLogin.style.display = "none";


    createButton.addEventListener("click", async () => {
        loginUserActive = false;
        if (createUserActive) {
            //Attemt to create user
            const userUsername = usernameTextArea.value;
            const userPassword = passwordTextArea.value;
            const userSteamUrl = steamUrlTextArea.value;

            if (userUsername.length <= 5) {
                noUsernameText.style.display = "flex";
                createUserUsername = false;
            } else {
                noUsernameText.style.display = "none";
                createUserUsername = true;
            }
            if (userPassword.length <= 5) {
                noPasswordText.style.display = "flex";
                createUserPassword = false;
            } else {
                noPasswordText.style.display = "none";
                createUserPassword = true;
            }
            if (userSteamUrl.length <= 9) {
                noSteamUrlText.style.display = "flex";
                createUserSteamUrl = false;
            } else {
                noSteamUrlText.style.display = "none";
                createUserSteamUrl = true;
            }
            if (createUserUsername && createUserPassword && createUserSteamUrl) {
                const response = await fetch("/api/mysql/users/set", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: userUsername,
                        password: userPassword,
                        steam_url: userSteamUrl
                    })
                });

                const data = await response.json();

                if (!data.ok && data.reason === "username_exists") {
                    usernameExistsText.style.display = "flex";
                }
                else {
                    usernameExistsText.style.display = "none";
                }
            }
        }
        incorrectLogin.style.display = "none";
        steamUrlfield.style.display = "flex";
        createUserActive = true;
    });

    const loginButton = document.getElementById("LoginUser");
    loginButton.addEventListener("click", async () => {
        createUserActive = false;
        if (loginUserActive) {
            //Attempt to login user

            const userUsername = usernameTextArea.value;
            const userPassword = passwordTextArea.value;
            const userSteamUrl = "";

            let dbRow = null;

            if (userUsername && userPassword) {
                try {
                    const res = await fetch("/api/mysql/users/get", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            username: userUsername,
                            password: userPassword
                        }),
                    });
                    dbRow = await res.json();
                } catch {
                }
            }
            console.log(dbRow);
            if (dbRow) {
                incorrectLogin.style.display = "none";
            } else {
                incorrectLogin.style.display = "flex";
            }
        }
        noUsernameText.style.display = "none";
        noPasswordText.style.display = "none";
        noSteamUrlText.style.display = "none";
        steamUrlfield.style.display = "none";
        loginUserActive = true;
    });
}

main()