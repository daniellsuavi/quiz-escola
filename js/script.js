// Lógica do quiz
const QUESTIONS_URL = 'data/questions.json';
const TOTAL_QUESTIONS = 6;

let allQuestions = [];
let currentSet = [];
let currentIndex = 0;
let answers = [];

const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const questionText = document.getElementById('question-text');
const optionsList = document.getElementById('options');
const nextBtn = document.getElementById('next-btn');
const quitBtn = document.getElementById('quit-btn');
const retryBtn = document.getElementById('retry-btn');
const currentEl = document.getElementById('current');
const totalEl = document.getElementById('total');
const scoreText = document.getElementById('score-text');
const reviewList = document.getElementById('review-list');
const seedInput = document.getElementById('seed-name');

async function loadQuestions(){
  try{
    const res = await fetch(QUESTIONS_URL);
    allQuestions = await res.json();
  }catch(e){
    console.error('Erro ao carregar perguntas', e);
    allQuestions = [];
  }
}

function shuffle(array, seed){
  // Fisher-Yates com semente simples baseada em string
  let a = array.slice();
  let random = seededRandom(seed);
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function seededRandom(seedStr){
  // simples gerador de número entre 0-1 a partir de string
  let h=2166136261>>>0;
  for(let i=0;i<seedStr.length;i++){
    h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  }
  return function(){
    h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5;
    return ((h >>> 0) % 1000) / 1000;
  }
}

function pickQuestions(seedName=''){
  const baseSeed = seedName.trim() || String(Date.now());
  const shuffled = shuffle(allQuestions, baseSeed);
  return shuffled.slice(0, TOTAL_QUESTIONS).map(q=>({ ...q }));
}

function renderQuestion(){
  const q = currentSet[currentIndex];
  currentEl.textContent = currentIndex + 1;
  totalEl.textContent = TOTAL_QUESTIONS;
  questionText.textContent = q.question;
  optionsList.innerHTML = '';
  nextBtn.disabled = true;

  q.options.forEach((opt, i)=>{
    const li = document.createElement('li');
    li.setAttribute('role','button');
    li.tabIndex = 0;
    li.textContent = opt;
    li.dataset.index = i;
    li.addEventListener('click', ()=> selectOption(li));
    li.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key===' ') selectOption(li); });
    optionsList.appendChild(li);
  });
}

function selectOption(li){
  [...optionsList.children].forEach(x=> x.setAttribute('aria-selected','false'));
  li.setAttribute('aria-selected','true');
  nextBtn.disabled = false;
}

function nextQuestion(){
  const selected = [...optionsList.children].find(x=> x.getAttribute('aria-selected') === 'true');
  const chosen = selected ? Number(selected.dataset.index) : null;
  answers.push({ question: currentSet[currentIndex], chosen });
  currentIndex++;
  if(currentIndex < TOTAL_QUESTIONS){
    renderQuestion();
  }else{
    showResults();
  }
}

function showResults(){
  quizScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');

  const correctCount = answers.reduce((acc,a)=> acc + ((a.chosen === a.question.answer) ? 1:0),0);
  scoreText.textContent = `Você acertou ${correctCount} de ${TOTAL_QUESTIONS} perguntas.`;

  reviewList.innerHTML = '';
  answers.forEach((a, idx)=>{
    const div = document.createElement('div');
    div.className = 'review-item';
    const qh = document.createElement('h3'); qh.textContent = `Pergunta ${idx+1}: ${a.question.question}`;
    const chosenText = a.chosen === null ? 'Não respondeu' : a.question.options[a.chosen];
    const correctText = a.question.options[a.question.answer];
    const p1 = document.createElement('p');
    p1.innerHTML = `<strong>Sua resposta:</strong> ${escapeHtml(chosenText)}`;
    const p2 = document.createElement('p');
    p2.innerHTML = `<strong>Resposta correta:</strong> ${escapeHtml(correctText)}`;
    const expl = document.createElement('p');
    expl.innerHTML = `<strong>Por quê:</strong> ${escapeHtml(a.question.explanation)}`;
    if(a.chosen === a.question.answer){
      div.classList.add('result-correct');
    }else{
      div.classList.add('result-wrong');
    }
    div.appendChild(qh);
    div.appendChild(p1);
    div.appendChild(p2);
    div.appendChild(expl);
    reviewList.appendChild(div);
  });
}

function escapeHtml(str){
  return str.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

function resetState(){
  currentIndex = 0;
  answers = [];
}

startBtn.addEventListener('click', async ()=>{
  startBtn.disabled = true;
  await loadQuestions();
  resetState();
  const seed = seedInput.value || '';
  currentSet = pickQuestions(seed);
  startScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');
  renderQuestion();
  startBtn.disabled = false;
});

nextBtn.addEventListener('click', ()=>{
  nextQuestion();
});

quitBtn.addEventListener('click', ()=>{
  // voltar ao start
  quizScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  resetState();
});

retryBtn.addEventListener('click', ()=>{
  // reiniciar com novo sorteio
  startScreen.classList.remove('hidden');
  quizScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  resetState();
});

// inicializa valores
totalEl.textContent = TOTAL_QUESTIONS;
