const map = document.getElementById("seatmap");
const dateInput = document.getElementById("showDate");
const timeInput = document.getElementById("showtime");
const form = document.getElementById("bookingForm");
const count = document.getElementById("seatCount");
const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
dateInput.min = today.toISOString().slice(0,10);
const selected = new Set();
const names = [];
["A","B","C","D","E","F"].forEach(row => { for(let n=1;n<=8;n++) names.push(row+n); });
function updateCount(){
  count.textContent = selected.size ? `${selected.size} seat(s) selected: ${[...selected].join(", ")}` : "Select your seats";
}
async function loadSeats(){
  map.innerHTML = "<p>Loading seats...</p>";
  selected.clear(); updateCount();
  if(!dateInput.value){ map.innerHTML="<p>Select a date to see seats.</p>"; return; }
  const params = new URLSearchParams({movie:window.MOVIE_ID,date:dateInput.value,time:timeInput.value});
  const response = await fetch("/api/booked-seats?"+params);
  const data = await response.json();
  map.innerHTML = '<div class="screen">SCREEN THIS WAY</div>';
  names.forEach(name => {
    const btn=document.createElement("button");
    btn.type="button"; btn.textContent=name; btn.className="seat";
    if(data.seats.includes(name)){btn.classList.add("booked");btn.disabled=true;}
    btn.addEventListener("click",()=>{
      if(selected.has(name)){selected.delete(name);btn.classList.remove("selected");}
      else{selected.add(name);btn.classList.add("selected");}
      updateCount();
    });
    map.appendChild(btn);
  });
}
dateInput.addEventListener("change",loadSeats);
timeInput.addEventListener("change",loadSeats);
form.addEventListener("submit",e=>{
  if(!selected.size){e.preventDefault();alert("Please select at least one seat.");return;}
  selected.forEach(seat=>{
    const input=document.createElement("input");input.type="hidden";input.name="seats";input.value=seat;form.appendChild(input);
  });
});
loadSeats();