<script>
    export let progress = 0; // Initial progress (0-100)
  </script>
  
  <style>
    .progress-bar {
      height: 10px; /* Adjust height as needed */
      background-color: #ddd;
      border-radius: 5px;
    }
  
    .progress-fill {
      height: 100%; /* Match container height */
      background-color: #ff3300; /* Adjust fill color */
      transition: width 0.2s ease-in-out;
    }
  </style>
  
  <div class="progress-bar">
    <div class="progress-fill" style="width: {progress}%"></div>
  </div>
  