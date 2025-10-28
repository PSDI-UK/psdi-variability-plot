/*
  variability.js

  Ray Whorley
  School of Chemistry and Chemical Engineering
  University of Southampton
  Started on 29/07/25
*/

// Associate the button with an event
$('#variabilityButton').click(goToVariabilityPage);

// Switches to the 'Reporting variability of numerical outcomes' page
function goToVariabilityPage(event) {
    const a = $("<a>")
          .attr("href", `static/content/variability.htm`)
          .appendTo("body");

    a[0].click();
    a.remove();
}
