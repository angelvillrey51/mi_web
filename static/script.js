const btn = document.getElementById("btn");
const texto = document.getElementById("texto");

btn.addEventListener("click", () => {
    document.body.style.background = "#0f5cff";
    btn.style.display = "none";
    texto.style.display = "block";
});
