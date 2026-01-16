const username  = document.getElementById("username");
const email     = document.getElementById("email");
const agree     = document.getElementById("agree");
const submitBtn = document.getElementById("submitBtn");
const keyup = document.getElementById("keyup");

const nameErr = document.createElement("p");
nameErr.textContent = "Name cannot contain numbers.";
nameErr.style.display = "none";
username.after(nameErr);

const emailErr = document.createElement("p");
emailErr.textContent = "Email must contain '.' and '@'.";
emailErr.style.display = "none";
email.after(emailErr);

const checkedErr = document.createElement("p");
checkedErr.textContent = "You must agree the checkbox before sending.";
checkedErr.style.display = "none";
agree.after(checkedErr);

agree.addEventListener("change", () => {
    submitBtn.disabled = !agree.checked;
});

keyup.after(nameErr);
keyup.addEventListener("keyup", () => {
    invalidNames  = hasDigits(keyup.value);
    if(invalidNames){
        nameErr.style.display = "block";
        keyup.classList.add("is-invalid");
    }else{
        nameErr.style.display = "none";
        keyup.classList.remove("is-invalid");
    }
});

const hasDigits = str => /\d/.test(str);

submitBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const name = username.value.trim();
    const mail = email.value.trim();

    const invalidName  = hasDigits(name);
    const invalidEmail = !(mail.includes("@") && mail.includes("."));
    const unchecked = !agree.checked;

    let hasError = false;

    nameErr.style.display  = "none";
    emailErr.style.display = "none";
    checkedErr.style.display = "none";

    username.classList.remove("is-invalid");
    email.classList.remove("is-invalid");
    checkedErr.classList.remove("is-invalid");

    if (invalidName) {
        nameErr.style.display = "block";
        username.classList.add("is-invalid");
        hasError = true;
    }

    if (invalidEmail) {
        emailErr.style.display = "block";
        email.classList.add("is-invalid");
        hasError = true;
    }

    if (unchecked){
        hasError = true
    }
    if (!hasError) {
        alert("Sent!");
        username.value = "";
        email.value = "";
        agree.checked = false;
    }
});