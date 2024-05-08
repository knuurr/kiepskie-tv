<script>

	export let title
	export let desc
	export let disclaimer = "Twoje wideo nigdzie nie jest wysłane - obróbka jest 100% offline"
</script>
  
<style>
	.container {
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	  justify-content: top;
	  /* height: 100vh; Adjust this value to fit your layout */
	  margin-top: 30px;
	  margin-bottom: 30px;
	}
	
	header {
	  text-align: center;
	}
  </style>
  
  <div class="container">
	<header>
	  <h1>{title}</h1>
	  <p>{desc}</p>
	  <p>{disclaimer}</p>
	</header>
  </div>
  