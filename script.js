    // Modern, accessible clock script
    (function(){
      const timeEl = document.getElementById('time');
      const ampmEl = document.getElementById('ampm');
      const formatSelect = document.getElementById('format');
      const tzSelect = document.getElementById('timezone');
      const lastUpdatedEl = document.getElementById('last-updated');
      const copyBtn = document.getElementById('copy');
      const downloadLink = document.getElementById('download');

      let format = localStorage.getItem('clock-format') || '24';
      let tz = localStorage.getItem('clock-tz') || 'local';

      formatSelect.value = format;
      tzSelect.value = tz;

      function getNow(){
        if(tz === 'local') return new Date();
        // Use Intl to get time in a given timezone
        const now = new Date();
        // Format into parts then reconstruct a Date-like string using the timezone offset
        // We will use toLocaleString with the timezone and parse components
        const opts = { timeZone: tz, hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit', year:'numeric', month:'2-digit', day:'2-digit'};
        const parts = new Intl.DateTimeFormat('en-GB', opts).formatToParts(now).reduce((acc,p)=>{acc[p.type]=p.value;return acc;},{ });
        // Construct an ISO-like string and return as Date
        const iso = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
        return new Date(iso);
      }

      function pad(n){return String(n).padStart(2,'0')}

      function update(){
        const now = getNow();
        let h = now.getHours();
        let m = now.getMinutes();
        let s = now.getSeconds();

        if(format === '12'){
          const isPm = h >= 12;
          const displayH = h % 12 || 12;
          timeEl.textContent = `${pad(displayH)}:${pad(m)}:${pad(s)}`;
          ampmEl.textContent = isPm ? 'PM' : 'AM';
          ampmEl.setAttribute('aria-hidden','false');
        } else {
          timeEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
          ampmEl.textContent = '24-hour';
          ampmEl.setAttribute('aria-hidden','true');
        }

        const nowIso = new Date().toISOString();
        lastUpdatedEl.textContent = new Date().toLocaleString();
        // prepare download link content
        const txt = `Time: ${timeEl.textContent} (${format}-hour)\nTimezone: ${tz}\nUpdated: ${nowIso}`;
        const blob = new Blob([txt], {type:'text/plain'});
        downloadLink.href = URL.createObjectURL(blob);

      }

      // initial update and interval
      update();
      // Align interval to the second boundary for accuracy
      const msUntilNextSecond = 1000 - (Date.now() % 1000);
      setTimeout(()=>{
        update();
        setInterval(update,1000);
      }, msUntilNextSecond);

      // event handlers
      formatSelect.addEventListener('change', e=>{
        format = e.target.value;
        localStorage.setItem('clock-format', format);
        update();
      });

      tzSelect.addEventListener('change', e=>{
        tz = e.target.value;
        localStorage.setItem('clock-tz', tz);
        update();
      });

      copyBtn.addEventListener('click', async ()=>{
        try{
          await navigator.clipboard.writeText(`${timeEl.textContent} (${format}-hour) — Timezone: ${tz}`);
          copyBtn.textContent = 'Copied';
          setTimeout(()=>copyBtn.textContent = 'Copy',1200);
        }catch(e){
          copyBtn.textContent = 'Fail';
          setTimeout(()=>copyBtn.textContent = 'Copy',1200);
        }
      });

      // Accessibility: expose time to screen readers using aria-live already added

      // If the browser does not support Intl.timeZone, fallback silently
      try{
        new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York'});
      }catch(e){
        // remove timezone selector if unsupported
        tzSelect.querySelector('option[value="local"]').selected = true;
        tzSelect.disabled = true;
      }

    })();
  