const form = document.getElementById("contactForm");
const username = document.getElementById("username");
const email = document.getElementById("email");
const message = document.getElementById("keyup");
const agree = document.getElementById("agree");
const submit = document.getElementById("submitBtn");
const count = document.getElementById("messageCount");

for (const field of [username, email, message]) {
    const error = document.createElement("p");
    error.id = `${field.id}Error`;
    error.className = "field-error";
    error.hidden = true;
    field.closest(".contact-field").append(error);
    field.setAttribute("aria-describedby", `${field.getAttribute("aria-describedby") || ""} ${error.id}`.trim());
    field.addEventListener("input", () => showError(field, ""));
}

function showError(field, text) {
    const error = document.getElementById(`${field.id}Error`);
    error.textContent = text;
    error.hidden = !text;
    field.classList.toggle("is-invalid", Boolean(text));
    field.setAttribute("aria-invalid", String(Boolean(text)));
}

agree.addEventListener("change", () => { submit.disabled = !agree.checked; });
message.addEventListener("input", () => { count.textContent = `${message.value.length} / 2000`; });
form.addEventListener("submit", event => {
    event.preventDefault();
    if (!agree.checked) { agree.focus(); return; }
    const errors = [
        [username, username.value.trim() ? "" : "Enter your name or username."],
        [email, email.value.trim() && email.validity.valid ? "" : "Enter a valid email address."],
        [message, message.value.trim() ? "" : "Tell us a little about your question or issue."],
    ];
    for (const [field, text] of errors) showError(field, text);
    const invalid = errors.find(([, text]) => text);
    if (invalid) { invalid[0].focus(); return; }

    // Preserve the existing submission behavior; message delivery is configured separately.
    alert("Sent!");
    form.reset();
    submit.disabled = true;
    count.textContent = "0 / 2000";
});
