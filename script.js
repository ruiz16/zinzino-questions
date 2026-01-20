// Aplicación de Flashcards con JavaScript puro
class FlashcardApp {
  constructor() {
    this.flashcards = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.learnedCards = new Set();
    
    // Elementos del DOM
    this.elements = {
      uploadSection: document.getElementById('upload-section'),
      flashcardSection: document.getElementById('flashcard-section'),
      startBtn: document.getElementById('start-btn'),
      flashcard: document.getElementById('flashcard'),
      flashcardInner: document.getElementById('flashcard-inner'),
      cardQuestion: document.getElementById('card-question'),
      cardAnswer: document.getElementById('card-answer'),
      prevBtn: document.getElementById('prev-btn'),
      nextBtn: document.getElementById('next-btn'),
      flipBtn: document.getElementById('flip-btn'),
      resetBtn: document.getElementById('reset-btn'),
      cardCounter: document.getElementById('card-counter'),
      progressFill: document.getElementById('progress-fill'),
      progressText: document.getElementById('progress-text'),
      learnedCount: document.getElementById('learned-count'),
      remainingCount: document.getElementById('remaining-count'),
      errorMessage: document.getElementById('error-message'),
      errorText: document.getElementById('error-text'),
      errorClose: document.getElementById('error-close')
    };
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.loadFromSessionStorage();
  }
  
  bindEvents() {
    // Evento de inicio
    this.elements.startBtn.addEventListener('click', () => this.loadQuestionsFile());
    
    // Eventos de navegación
    this.elements.prevBtn.addEventListener('click', () => this.previousCard());
    this.elements.nextBtn.addEventListener('click', () => this.nextCard());
    this.elements.flipBtn.addEventListener('click', () => this.flipCard());
    this.elements.resetBtn.addEventListener('click', () => this.resetApp());
    
    // Eventos de la tarjeta
    this.elements.flashcard.addEventListener('click', () => this.flipCard());
    
    // Eventos de error
    this.elements.errorClose.addEventListener('click', () => this.hideError());
    
    // Navegación con teclado
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }
  
  async loadQuestionsFile() {
    try {
      const response = await fetch('questions.csv');
      
      if (!response.ok) {
        throw new Error(`No se pudo cargar el archivo questions.csv (Status: ${response.status})`);
      }
      
      const csvText = await response.text();
      this.parseCSV(csvText);
      
    } catch (error) {
      this.showError('Error al cargar las preguntas: ' + error.message);
      console.error(error);
    }
  }
  
  parseCSV(csvText) {
    try {
      const lines = csvText.trim().split('\n');
      const cards = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Manejar diferentes formatos de CSV
        let question, answer;
        
        // Intentar detectar delimitador
        if (line.includes(',')) {
          // CSV simple con comas - Manejo básico de comas dentro de comillas si es necesario, 
          // pero para simplificar asumimos formato pregunta,respuesta
          // Si hay comillas, intentar respetarlas
          if (line.includes('"')) {
             // Regex simple para CSV con comillas
             const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
             if (matches && matches.length >= 2) {
               question = matches[0].replace(/^"|"$/g, '').trim();
               answer = matches[1].replace(/^"|"$/g, '').trim();
               // Si hay más partes, unirlas a la respuesta por si acaso
               if (matches.length > 2) {
                 answer = matches.slice(1).join(',').replace(/^"|"$/g, '').trim();
               }
             } else {
                const parts = line.split(',');
                question = parts[0].trim();
                answer = parts.slice(1).join(',').trim();
             }
          } else {
            const parts = line.split(',');
            question = parts[0].trim();
            answer = parts.slice(1).join(',').trim();
          }
        } else if (line.includes(';')) {
          const parts = line.split(';');
          question = parts[0].trim();
          answer = parts.slice(1).join(';').trim();
        } else if (line.includes('\t')) {
          const parts = line.split('\t');
          question = parts[0].trim();
          answer = parts.slice(1).join('\t').trim();
        } else {
           // Fallback a primer espacio
           const firstSpaceIndex = line.indexOf(' ');
           if (firstSpaceIndex !== -1) {
             question = line.substring(0, firstSpaceIndex).trim();
             answer = line.substring(firstSpaceIndex + 1).trim();
           }
        }
        
        if (question && answer) {
          cards.push({ question, answer });
        }
      }
      
      if (cards.length === 0) {
        this.showError('No se encontraron preguntas y respuestas válidas en el archivo.');
        return;
      }
      
      this.flashcards = cards;
      this.currentIndex = 0;
      this.isFlipped = false;
      this.learnedCards.clear();
      
      this.saveToSessionStorage();
      this.showFlashcardSection();
      this.updateUI();
      
    } catch (error) {
      console.warn('Error al procesar el archivo CSV: ' + error.message);
      this.showError('Error al procesar el archivo CSV: ' + error.message);
    }
  }
  
  showFlashcardSection() {
    this.elements.uploadSection.classList.add('hidden');
    this.elements.flashcardSection.classList.remove('hidden');
  }
  
  showUploadSection() {
    this.elements.flashcardSection.classList.add('hidden');
    this.elements.uploadSection.classList.remove('hidden');
  }
  
  flipCard() {
    if (this.flashcards.length === 0) return;
    
    this.isFlipped = !this.isFlipped;
    this.elements.flashcard.classList.toggle('flipped', this.isFlipped);
    
    // Marcar como aprendida si se voltea
    if (this.isFlipped) {
      this.learnedCards.add(this.currentIndex);
      this.updateStats();
    }
  }
  
  previousCard() {
    if (this.flashcards.length === 0) return;
    
    this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.flashcards.length - 1;
    this.isFlipped = false;
    this.updateUI();
  }
  
  nextCard() {
    if (this.flashcards.length === 0) return;
    
    this.currentIndex = this.currentIndex < this.flashcards.length - 1 ? this.currentIndex + 1 : 0;
    this.isFlipped = false;
    this.updateUI();
  }
  
  updateUI() {
    if (this.flashcards.length === 0) return;
    
    const currentCard = this.flashcards[this.currentIndex];
    
    // Actualizar contenido de la tarjeta
    this.elements.cardQuestion.textContent = currentCard.question;
    this.elements.cardAnswer.textContent = currentCard.answer;
    
    // Actualizar contador
    this.elements.cardCounter.textContent = `Tarjeta ${this.currentIndex + 1} de ${this.flashcards.length}`;
    
    // Actualizar progreso
    const progress = ((this.currentIndex + 1) / this.flashcards.length) * 100;
    this.elements.progressFill.style.width = `${progress}%`;
    this.elements.progressText.textContent = `${this.currentIndex + 1} / ${this.flashcards.length}`;
    
    // Actualizar estadísticas
    this.updateStats();
    
    // Resetear el estado de volteo
    this.elements.flashcard.classList.remove('flipped');
    this.isFlipped = false;
  }
  
  updateStats() {
    const learned = this.learnedCards.size;
    const remaining = this.flashcards.length - learned;
    
    this.elements.learnedCount.textContent = learned;
    this.elements.remainingCount.textContent = remaining;
  }
  
  handleKeyboard(event) {
    if (this.flashcards.length === 0) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousCard();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextCard();
        break;
      case ' ':
        event.preventDefault();
        this.flipCard();
        break;
      case 'Home':
        event.preventDefault();
        this.currentIndex = 0;
        this.updateUI();
        break;
      case 'End':
        event.preventDefault();
        this.currentIndex = this.flashcards.length - 1;
        this.updateUI();
        break;
    }
  }
  
  showError(message) {
    this.elements.errorText.textContent = message;
    this.elements.errorMessage.classList.remove('hidden');
  }
  
  hideError() {
    this.elements.errorMessage.classList.add('hidden');
  }
  
  resetApp() {
    this.flashcards = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.learnedCards.clear();
    
    sessionStorage.removeItem('flashcards-data');
    sessionStorage.removeItem('flashcards-progress');
    
    this.showUploadSection();
  }
  
  saveToSessionStorage() {
    const data = {
      flashcards: this.flashcards,
      currentIndex: this.currentIndex,
      learnedCards: Array.from(this.learnedCards)
    };
    
    sessionStorage.setItem('flashcards-data', JSON.stringify(data));
  }
  
  loadFromSessionStorage() {
    try {
      const savedData = sessionStorage.getItem('flashcards-data');
      if (savedData) {
        const data = JSON.parse(savedData);
        
        if (data.flashcards && data.flashcards.length > 0) {
          this.flashcards = data.flashcards;
          this.currentIndex = data.currentIndex || 0;
          this.learnedCards = new Set(data.learnedCards || []);
          
          this.showFlashcardSection();
          this.updateUI();
        }
      }
    } catch (error) {
      console.warn('Error al cargar datos guardados:', error);
      sessionStorage.removeItem('flashcards-data');
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new FlashcardApp();
});