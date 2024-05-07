<script>

	export let title
	export let desc
</script>
  
<style>
	.container {
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	  justify-content: top;
	  /* height: 100vh; Adjust this value to fit your layout */
	}
	
	header {
	  text-align: center;
	}
  </style>
  
  <div class="container">
	<header>
	  <h1>{title}</h1>
	  <p>{desc}</p>
	</header>
  </div>
  