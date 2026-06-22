const player = document.getElementById("player");
const game = document.getElementById("game");
const coinsText = document.getElementById("coins");
const shop = document.getElementById("shop");

let x = 280;
let y = 180;
let coins = Number(localStorage.getItem("coins")) || 0;
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

coinsText.textContent = coins;

function saveGame() {
  localStorage.setItem("coins", coins);
  localStorage.setItem("inventory", JSON.stringify(inventory));
}

function movePlayer() {
  player.style.left = x + "px";
  player.style.top = y + "px";
}

document.addEventListener("keydown", function(event) {
  const speed = 15;

  if (event.key === "ArrowUp" && y > 0) y -= speed;
  if (event.key === "ArrowDown" && y < 350) y += speed;
  if (event.key === "ArrowLeft" && x > 0) x -= speed;
  if (event.key === "ArrowRight" && x < 550) x += speed;

  movePlayer();
  checkCoins();
});

function createCoin() {
  const coin = document.createElement("div");
  coin.classList.add("coin");
  coin.textContent = "🪙";

  coin.style.left = Math.floor(Math.random() * 560) + "px";
  coin.style.top = Math.floor(Math.random() * 360) + "px";

  game.appendChild(coin);
}

function checkCoins() {
  const coinElements = document.querySelectorAll(".coin");

  coinElements.forEach((coin) => {
    const coinX = parseInt(coin.style.left);
    const coinY = parseInt(coin.style.top);

    if (Math.abs(x - coinX) < 35 && Math.abs(y - coinY) < 35) {
      coin.remove();
      coins += 1;
      coinsText.textContent = coins;
      saveGame();
      createCoin();
    }
  });
}

function openShop() {
  shop.classList.remove("hidden");
}

function closeShop() {
  shop.classList.add("hidden");
}

function buyItem(itemName, price) {
  if (inventory.includes(itemName)) {
    alert("Эта вещь уже куплена!");
    return;
  }

  if (coins >= price) {
    coins -= price;
    inventory.push(itemName);
    coinsText.textContent = coins;
    saveGame();

    if (itemName === "cap") {
      player.textContent = "🧢";
    }

    alert("Покупка успешна!");
  } else {
    alert("Не хватает монет!");
  }
}

function buyCrown() {
  window.open(
    "https://buy.stripe.com/test_6oUaEW45qeGubeG7dxcjS00",
    "_blank"
  );
}

function resetGame() {
  localStorage.clear();
  location.reload();
}

for (let i = 0; i < 8; i++) {
  createCoin();
}

if (inventory.includes("cap")) {
  player.textContent = "🧢";
}
