const SUPABASE_URL = "https://lxaevejpohmkkusbjobg.supabase.co";
const SUPABASE_KEY = "sb_publishable_mlX7HkRy6pxtNcRPo95iTw_ipHQ7sRH";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const player = document.getElementById("player");
const game = document.getElementById("game");
const coinsText = document.getElementById("coins");
const shop = document.getElementById("shop");
const modeNameText = document.getElementById("modeName");
const hpText = document.getElementById("hp");
const bot = document.getElementById("bot");

let x = 280;
let y = 180;

let botX = 100;
let botY = 100;
let botHp = 100;

let hp = 100;
let coins = 0;
let inventory = [];
let currentMode = "world";
let survivalEnded = false;

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
  hpText.textContent = hp;

  clearCoins();

  for (let i = 0; i < 8; i++) {
    createCoin();
  }

  setMode("world");
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

function setMode(mode) {
  currentMode = mode;
  survivalEnded = false;
  hp = 100;
  botHp = 100;

  hpText.textContent = hp;

  game.classList.remove("world-mode", "rivals-mode", "survival-mode");

  if (mode === "world") {
    modeNameText.textContent = "Обычный мир";
    game.classList.add("world-mode");
    bot.classList.add("hidden");
  }

  if (mode === "rivals") {
    modeNameText.textContent = "Rivals";
    game.classList.add("rivals-mode");
    spawnBot();
    bot.classList.remove("hidden");
  }

  if (mode === "survival") {
    modeNameText.textContent = "Выживание";
    game.classList.add("survival-mode");
    spawnBot();
    bot.classList.remove("hidden");
    alert("☠️ Выживание началось! У тебя одна жизнь.");
  }
}

function movePlayer() {
  player.style.left = x + "px";
  player.style.top = y + "px";
}

function spawnBot() {
  botX = Math.floor(Math.random() * 520);
  botY = Math.floor(Math.random() * 320);

  bot.style.left = botX + "px";
  bot.style.top = botY + "px";
  bot.textContent = "🤖";
  botHp = 100;
}

document.addEventListener("keydown", async function(event) {
  const speed = 15;

  if (survivalEnded) return;

  if (event.key === "ArrowUp" && y > 0) y -= speed;
  if (event.key === "ArrowDown" && y < 350) y += speed;
  if (event.key === "ArrowLeft" && x > 0) x -= speed;
  if (event.key === "ArrowRight" && x < 550) x += speed;

  if (event.code === "Space") {
    await attackBot();
  }

  movePlayer();
  await checkCoins();

  if (currentMode === "rivals" || currentMode === "survival") {
    await botAttackIfClose();
  }
});

function createCoin() {
  const coin = document.createElement("div");
  coin.classList.add("coin");
  coin.textContent = "🪙";

  coin.style.left = Math.floor(Math.random() * 560) + "px";
  coin.style.top = Math.floor(Math.random() * 360) + "px";

  game.appendChild(coin);
}

function clearCoins() {
  document.querySelectorAll(".coin").forEach((coin) => coin.remove());
}

async function checkCoins() {
  const coinElements = document.querySelectorAll(".coin");

  for (const coin of coinElements) {
    const coinX = parseInt(coin.style.left);
    const coinY = parseInt(coin.style.top);

    if (Math.abs(x - coinX) < 35 && Math.abs(y - coinY) < 35) {
      coin.remove();

      const reward = inventory.includes("crown") ? 2 : 1;
      coins += reward;

      coinsText.textContent = coins;
      createCoin();
      await savePlayer();
    }
  }
}

async function attackBot() {
  if (currentMode === "world") return;

  const distance = Math.abs(x - botX) + Math.abs(y - botY);

  if (distance > 70) {
    return;
  }

  botHp -= 25;
  bot.textContent = "💥";

  setTimeout(() => {
    if (botHp > 0) bot.textContent = "🤖";
  }, 200);

  if (botHp <= 0) {
    bot.textContent = "☠️";

    if (currentMode === "rivals") {
      coins += 10;
      coinsText.textContent = coins;
      await savePlayer();

      alert("⚔️ Победа в Rivals! +10 монет");
      spawnBot();
    }

    if (currentMode === "survival") {
      coins += 25;
      coinsText.textContent = coins;
      await savePlayer();

      survivalEnded = true;
      alert("🏆 Ты выжил! +25 монет");
      bot.classList.add("hidden");
    }
  }
}

async function botAttackIfClose() {
  const distance = Math.abs(x - botX) + Math.abs(y - botY);

  if (distance < 60) {
    hp -= 5;
    hpText.textContent = hp;

    if (hp <= 0) {
      hp = 0;
      hpText.textContent = hp;

      if (currentMode === "rivals") {
        alert("💀 Ты проиграл бой. Новый раунд!");
        hp = 100;
        hpText.textContent = hp;
        spawnBot();
      }

      if (currentMode === "survival") {
        survivalEnded = true;
        alert("💀 Ты проиграл в Выживании. Раунд окончен.");
        bot.classList.add("hidden");
      }
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

function fakePayment(itemEmoji) {
  alert("Пока это демо. Настоящую оплату подключим позже.");
  player.textContent = itemEmoji;
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
