<script lang="ts">
    // export let githubUrl = "https://github.com/knuurr"; // Replace with your GitHub URL
    // export let projectUrl = "https://github.com/knuurr/kiepscy-tv";
    import { GH_PROJECT_URL, GH_PROFILE_URL } from './Constans.svelte'; // Import all from data.js

  </script>
  
  <style>
    footer {
      text-align: center;
      margin-top: 5rem; /* Adjust margin as needed */
    }
  
    a {
      color: #e7d000;
      text-decoration: none;
      margin: 0.5rem;
    }
  
    a:hover {
      text-decoration: underline;
    }

    p {
        color: gray;
    }

    * {
      margin-top: 1rem;
      margin-bottom: 1rem;
    }
  </style>
  
  <footer>
    <p style="color: white;">© Jakub Mikos 2024 </p>
    <a href="{GH_PROFILE_URL}">Mój Github (knuurr)</a>
    <a href="{GH_PROJECT_URL}">GitHub Projektu</a>
    <!-- <a href="{liUrl}">LinkedIn</a> -->
    <br/>
    <p >Nazwa "Okił" nawiązuje do fikcyjnej marki telewizora w serialu "Świat Weług Kiepskich". Zbieżność nazwisk przypadkowa.</p>
    <p >Projekt nie jest w żadnen sposób powiązany z serialem "Świat Według Kiepskich" autorstwa ATM GRUPA SPÓŁKA AKCYJNA.</p>
    

  </footer>
  