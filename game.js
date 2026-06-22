
const SUPABASE_URL = "https://lxaevejpohmkkusbjobg.supabase.co";
const SUPABASE_KEY = "sb_publishable_mlX7HkRy6pxtNcRPo95iTw_ipHQ7sRH";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const player = document.getElementById("player");
const game = document.getElementById("game");
const coinsText = document.getElementById("coins");
const shop = document.getElementById("shop");

let x = 280;
let y = 180;
let coins = 0;
let inventory = [];
let playerEmail = localStorage.getItem("playerEmail");

async function startGame() {
  if (!playerEmail) {
    playerEmail = prompt("Введите email игрока:");
    if (!playerEmail) {
      alert("Без email игра будет работать только на этом устройстве.");
      playerEmail = "guest_" + Date.now() + "@game.local";
    }
    localStorage.setItem("playerEmail", playerEmail);
  }

  await loadPlayer();
  coinsText.textContent = coins;

  for (let i = 0; i < 8; i++) {
    createCoin();
  }

  applyInventory();
}

async function loadPlayer() {
  const { data, error } = await supabaseClient
    .from("players")
    .select("*")
    .eq("email", playerEmail)
    .maybeSingle();

  if (error) {
    console.error(error);
    alert("Ошибка загрузки игрока из Supabase.");
    return;
  }

  if (!data) {
    const { error: insertError } = await supabaseClient
      .from("players")
      .insert({
        email: playerEmail,
        coins: 0,
        crown: false,
        pet: false
      });

    if (insertError) {
      console.error(insertError);
      alert("Ошибка создания игрока.");
      return;
    }

    coins = 0;
    inventory = [];
  } else {
    coins = data.coins || 0;
    inventory = [];

    if (data.crown) inventory.push("crown");
    if (data.pet) inventory.push("pet");
  }
}

async function savePlayer() {
  const hasCrown = inventory.includes("crown");
  const hasPet = inventory.includes("pet");

  const { error } = await supabaseClient
    .from("players")
    .update({
      coins: coins,
      crown: hasCrown,
      pet: hasPet
    })
    .eq("email", playerEmail);

  if (error) {
    console.error(error);
    alert("Ошибка сохранения игрока.");
  }
}

function movePlayer() {
  player.style.left = x + "px";
  player.style.top = y + "px";
}

document.addEventListener("keydown", async function(event) {
  const speed = 15;

  if (event.key === "ArrowUp" && y > 0) y -= speed;
  if (event.key === "ArrowDown" && y < 350) y += speed;
  if (event.key === "ArrowLeft" && x > 0) x -= speed;
  if (event.key === "ArrowRight" && x < 550) x += speed;

  movePlayer();
  await checkCoins();
});

function createCoin() {
  const coin = document.createElement("div");
  coin.classList.add("coin");
  coin.textContent = "🪙";

  coin.style.left = Math.floor(Math.random() * 560) + "px";
  coin.style.top = Math.floor(Math.random() * 360) + "px";

  game.appendChild(coin);
}

async function checkCoins() {
  const coinElements = document.querySelectorAll(".coin");

  for (const coin of coinElements) {
    const coinX = parseInt(coin.style.left);
    const coinY = parseInt(coin.style.top);

    if (Math.abs(x - coinX) < 35 && Math.abs(y - coinY) < 35) {
      coin.remove();
      coins += 1;
      coinsText.textContent = coins;
      createCoin();
      await savePlayer();
    }
  }
}

function openShop() {
  shop.classList.remove("hidden");
}

function closeShop() {
  shop.classList.add("hidden");
}

async function buyItem(itemName, price) {
  if (inventory.includes(itemName)) {
    alert("Эта вещь уже куплена!");
    return;
  }

  if (coins < price) {
    alert("Не хватает монет!");
    return;
  }

  coins -= price;
  inventory.push(itemName);
  coinsText.textContent = coins;

  applyInventory();
  await savePlayer();

  alert("Покупка успешна!");
}

function buyCrown() {
  window.open(
    "https://buy.stripe.com/test_6oUaEW45qeGubeG7dxcjS00",
    "_blank"
  );
}

function applyInventory() {
  if (inventory.includes("crown")) {
    player.textContent = "👑";
  } else if (inventory.includes("pet")) {
    player.textContent = "🐉";
  } else {
    player.textContent = "🙂";
  }
}

async function resetGame() {
  localStorage.clear();

  if (playerEmail) {
    await supabaseClient
      .from("players")
      .delete()
      .eq("email", playerEmail);
  }

  location.reload();
}

startGame();
