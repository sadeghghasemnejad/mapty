'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const removeAllWorkout = document.querySelector('.remove-all-workout');
const btnContainer = document.querySelector('.btn-container');
const sortList = document.querySelector('.sort-form');
const sortBtn = document.querySelector('.sort-form-btn');
const activeDeactiveBtn = document.querySelectorAll('.active-deactive-btn');

class workout {
  date = new Date();
  id = String(Date.now()).slice(-10);
  type;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _description() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class running extends workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.type = 'running';
    this._description();
    this._clacPace();
  }
  _clacPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class cycling extends workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.type = 'cycling';
    this._description();
    this._calcSpeed();
  }
  _calcSpeed() {
    this.speed = this.distance / this.duration;
    return this.speed;
  }
}
class App {
  #map;
  #workouts = [];
  #mapEvent;
  #popupArray = [];
  _reverseSort = 'deactive';
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    inputType.addEventListener('change', this._toggleForm);
    form.addEventListener('submit', this._renderWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._movetoPopup.bind(this));
    containerWorkouts.addEventListener('click', this._showEditForm.bind(this));
    containerWorkouts.addEventListener('click', this._deleteWorkout.bind(this));
    if (this.#workouts.length !== 0) {
      btnContainer.style.display = 'block';
      btnContainer.style.display = 'flex';
      removeAllWorkout.addEventListener(
        'click',
        this._removeAllWorkouts.bind(this)
      );
    }
    sortBtn.addEventListener('click', this._sortWorkList.bind(this));
    activeDeactiveBtn.forEach(btn =>
      btn.addEventListener('click', this._activeOrDeactiveSort.bind(this))
    );
    // containerWorkouts.addEventListener('click',this._submitEditWorkout.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('i cant access your location!');
        }
      );
    }
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;

    this.#map = L.map('map').setView([latitude, longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;

    form.classList.remove('hidden');
  }
  _renderWorkout(e) {
    e.preventDefault();
    const checkFinite = (...inputs) => inputs.every(fin => isFinite(fin));
    const checkPositive = (...inputs) => inputs.every(pos => pos > 0);
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const type = inputType.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !checkFinite(distance, duration, cadence) ||
        !checkPositive(distance, duration, cadence)
      )
        return alert('wrong number');
      workout = new running([lat, lng], distance, duration, cadence);
    }
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (
        !checkFinite(distance, duration, elevationGain) ||
        !checkPositive(distance, duration, elevationGain)
      )
        return alert('wrong number');
      workout = new cycling([lat, lng], distance, duration, elevationGain);
    }
    this.#workouts.push(workout);

    this._renderWorkoutMarker(workout);

    this._showWorkout(workout);
    this._hideForm();
    if (this.#workouts.length !== 0) {
      btnContainer.style.display = 'block';
      btnContainer.style.display = 'flex';
    }
    removeAllWorkout.addEventListener(
      'click',
      this._removeAllWorkouts.bind(this)
    );
    this._setLocalStorage();
  }
  _renderWorkoutMarker(work) {
    const l = L.marker(work.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${work.type}-popup`,
        }).setContent(
          `${work.type === 'running' ? '🏃' : '🚴‍♀️'} ${work.description}`
        )
      )
      .openPopup();

    this.#popupArray.push(l);
  }
  _showWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <div class="workout--1--${workout.type}">
      <span
        ><img
          class="workout--1_edit"
          src="./write.png"
          alt="edit"
          width="25"
      /></span>
      <span>
        <img
          class="workout--1_delete"
          src="./reject.png"
          alt="cancel"
          width="25"
        />
      </span>
    </div>
    <div class="workout--2">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout--2--main">
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    }
    if (workout.type === 'cycling') {
      html += ` <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _removeWorkout() {
    document.querySelectorAll('.workout').forEach(work => work.remove());
  }
  _showEditForm(e) {
    if (e.target.classList.contains('workout--1_edit')) {
      const workoutElement = e.target.closest('.workout');
      const workout = this.#workouts.find(
        work => work.id === workoutElement.dataset.id
      );
      const html = `<li>
      <form class="form-edit">
      <div class="form__row">
        <label class="form__label">Distance</label>
        <input class="form__input form__input--distance-edit" placeholder="km" />
      </div>
      <div class="form__row">
        <label class="form__label">Duration</label>
        <input
          class="form__input form__input--duration-edit"
          placeholder="min"
        />
      </div>
      <div class="form__row">
        <label class="form__label">Cadence</label>
        <input
          class="form__input form__input--cadence-edit"
          placeholder="step/min"
        />
      </div>
      <div class="form__row form__row--hidden">
        <label class="form__label">Elev Gain</label>
        <input
          class="form__input form__input--elevation-edit"
          placeholder="meters"
        />
      </div>
      <input type="submit" class="edit-submit--${workout.type}" value="edit">
    </form>
    </li>`;
      e.target.closest('.workout').insertAdjacentHTML('afterend', html);
      if (workout.type === 'cycling') {
        document
          .querySelector('.form__input--elevation-edit')
          .closest('.form__row')
          .classList.remove('form__row--hidden');
        document
          .querySelector('.form__input--cadence-edit')
          .closest('.form__row')
          .classList.add('form__row--hidden');
      }

      document
        .querySelector('.form-edit')
        .addEventListener('submit', function (e) {
          e.preventDefault();
          const distanceE = +document.querySelector(
            '.form__input--distance-edit'
          ).value;
          const durationE = +document.querySelector(
            '.form__input--duration-edit'
          ).value;
          const cadenceE = +document.querySelector('.form__input--cadence-edit')
            .value;
          const elevationGainE = +document.querySelector(
            '.form__input--elevation-edit'
          ).value;

          const checkFiniteE = (...inputs) =>
            inputs.every(fin => isFinite(fin));
          const checkPositiveE = (...inputs) => inputs.every(pos => pos > 0);
          workout.distance = distanceE;
          workout.duration = durationE;
          if (workout.type === 'running') {
            if (
              !checkFiniteE(distanceE, durationE, cadenceE) ||
              !checkPositiveE(distanceE, durationE, cadenceE)
            ) {
              return alert('enter correct number');
            }
            workout.cadence = cadenceE;
          }
          if (workout.type === 'cycling') {
            if (
              !checkFiniteE(distanceE, durationE, elevationGainE) ||
              !checkPositiveE(distanceE, durationE, elevationGainE)
            ) {
              return alert('enter correct number');
            }
            workout.elevationGain = elevationGainE;
          }
          app._setLocalStorage();
          app._removeWorkout();
          app.#workouts.forEach(work => app._showWorkout(work));
          document.querySelectorAll('.form-edit').forEach(f => f.remove());
          // location.reload();
        });
    }
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleForm() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _movetoPopup(e) {
    if (e.target.closest('.workout') != null) {
      const workoutElementId = e.target.closest('.workout').dataset.id;
      const workout = this.#workouts.find(work => work.id === workoutElementId);
      this.#map.setView(workout.coords, 13);
    }
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => this._showWorkout(work));
  }
  _deleteWorkout(e) {
    if (e.target.classList.contains('workout--1_delete')) {
      const workoutEl = e.target.closest('.workout');
      const workout = this.#workouts.find(
        work => work.id === workoutEl.dataset.id
      );
      const indexofWorkout = this.#workouts.indexOf(workout);
      this.#workouts.splice(indexofWorkout, 1);
      const workoutpop = this.#popupArray.find(
        pop =>
          pop._latlng.lat === workout.coords[0] &&
          pop._latlng.lng === workout.coords[1]
      );
      workoutpop.closePopup();
      this.#map.removeLayer(workoutpop);
      this._removeWorkout();
      this.#workouts.forEach(work => this._showWorkout(work));
      if (this.#workouts.length === 0) {
        btnContainer.style.display = 'none';
      }
      this._setLocalStorage();
    }
  }
  _removeAllWorkouts(e) {
    this.#workouts.forEach(work => this._removeWorkout());
    this.#workouts = [];
    this.#popupArray.forEach(pop => this.#map.removeLayer(pop));
    btnContainer.style.display = 'none';
    this._setLocalStorage();
  }
  _activeOrDeactiveSort(e) {
    if (e.target.classList.contains('active')) {
      e.target.classList.add('hide');
      document.querySelector('.deactive').classList.remove('hide');
      this._reverseSort = 'deactive';
    }
    if (e.target.classList.contains('deactive')) {
      document.querySelector('.deactive').classList.add('hide');
      document.querySelector('.active').classList.remove('hide');
      this._reverseSort = 'active';
    }
  }
  _sortWorkList(e) {
    if (this._reverseSort === 'deactive') {
      switch (sortList.value) {
        case 'date':
          this.#workouts.sort((a, b) => new Date(a.date) - new Date(b.date));
          break;
        case 'distance':
          console.log('hi');
          this.#workouts.sort((a, b) => a.distance - b.distance);
          break;
        case 'duration':
          this.#workouts.sort((a, b) => a.duration - b.duration);
          break;
      }
    }
    if (this._reverseSort === 'active') {
      switch (sortList.value) {
        case 'date':
          this.#workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
          break;
        case 'distance':
          console.log('hi');
          this.#workouts.sort((a, b) => b.distance - a.distance);
          break;
        case 'duration':
          this.#workouts.sort((a, b) => b.duration - a.duration);
          break;
      }
    }

    this.#workouts.forEach(work => app._removeWorkout());
    this.#workouts.forEach(work => app._showWorkout(work));
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();
