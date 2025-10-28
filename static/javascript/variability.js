/*
  variability.js

  Ray Whorley
  School of Chemistry and Chemical Engineering
  University of Southampton
  Started on 26/07/25
*/

var measCount = 5;

if (sessionStorage.getItem("compound") !== null) {
    $('#compound').val(sessionStorage.getItem("compound"));
}

if (sessionStorage.getItem("type") !== null) {
    $('#type').val(sessionStorage.getItem("type"));
}

if ((sessionStorage.getItem("measurements") !== null) &&
    (sessionStorage.getItem("measurements") != [])) {
    var measArray = sessionStorage.getItem("measurements").split('£');

    for (var n = 1; n <= measCount; n++) {
        $('#measure' + n).val(measArray[n - 1]);
    }
}

if (sessionStorage.getItem("imageWidth") !== null) {
    $('#width').val(sessionStorage.getItem("imageWidth"));
}
else {
    $('#width').val('640');
}

if (sessionStorage.getItem("imageHeight") !== null) {
    $('#height').val(sessionStorage.getItem("imageHeight"));
}
else {
    $('#height').val('480');
}

if (sessionStorage.getItem("imageHeight") !== null) {
    $('#image').height(sessionStorage.getItem("imageHeight"));
}
else {
    $('#image').height('480');
}

// Associate buttons with an event
$('#genButton').click(generate);
$('#addButton').click(addMeasurement);
$('#saveButton').click(download);

// Download a file of the generated plot in the selected format
function download() {
    const format = $('#imageType').val();
    var form_data = new FormData();
    form_data.append('format', format);
//    alert(sessionStorage.getItem("measurements"));

    var jqXHR = $.ajax({
        url: `/download/`,
        type: "POST",
        data: form_data,
        processData: false,
        contentType: false,
        success: async function () {
            const delay = ms => new Promise(response => setTimeout(response, ms));

            downloadFile(`../fig/fig.` + format, `fig.` + format)
            await delay(300)

            $.ajax({      // ajax call to retrieve image file later
                url: `/`,
                type: "GET"
            })
            location.reload(); // temp. solution, involving sessionStorage
        }
    })
}

// A link is created, clicked and removed, resulting in the download of a file
function downloadFile(path, filename) {
    const a = $("<a>")
          .attr("href", path)
          .attr("download", filename)
          .appendTo("body");
    a[0].click();
    a.remove();
}

// Add a labelled text box for entering a measurement
function addMeasurement() {
    measCount = measCount + 1;

    const measLabel = 'measLabel' + measCount,
        measure = 'measure' + measCount;

    var $newItem = $('<label for=measure id=measLabel>' + measCount +
        ': </label><input type="text" size="30" id=measure /><br><br>');

    $('#measurements').append($newItem);

//    $('#measurements').append($('<label for=measure id=measLabel>' + measCount +
  //      ': </label><input type="text" size="30" id=measure /><br><br>'))

//    $('<div />')
  //  .html($('<label for=measure id=measLabel>' + measCount +
    //    ': </label><input type="text" size="30" id=measure /><br><br>'))
//    .insertBefore(this);
}

// Gather the data required to generate a plot
function generate() {
    const compound = $('#compound').val(),
          type = $('#type').val(),
          width = $('#width').val(),
          height = $('#height').val();

    var form_data = new FormData(),
        measurement = '',
        count = 0;

    for (var n = 1; n <= measCount; n++) {
        if ($('#measure' + n).val()) {
            measurement += $('#measure' + n).val() + '£';
            count++;
        }
    }

//    sessionStorage.setItem("compound", document.getElementById('compound').value);
    sessionStorage.setItem("compound", compound);
    sessionStorage.setItem("type", type);
    sessionStorage.setItem("measurements", measurement);
    sessionStorage.setItem("imageWidth", width);
    sessionStorage.setItem("imageHeight", height);

    if (count >= 3) {
        form_data.append('compound', compound);
        form_data.append('type', type);
        form_data.append('measurements', measurement);
        form_data.append('imageWidth', width);
        form_data.append('imageHeight', height);
//        alert(measurement);
//        deletePlot()
        generatePlot(form_data);
        $('#image').replaceWith('<img src="../fig/fig.png?" + newDate().getTime() ' +
                                ' alt="Image Placeholder" height=height id="image">');
//        $('#image').css('height', '125px');
    }
    else {
        alert("At least three measurements must be entered.")
    }
}

// Send data to the back end and show the resulting plot
function generatePlot(form_data) {
    var jqXHR = $.ajax({
        url: `/generate/`,
        type: "POST",
        data: form_data,
        processData: false,
        contentType: false,
        success: async function () {
            $.ajax({      // ajax call not doing anything
                url: `/`,
                type: "GET"
            })
//            $('#image').removeAttr('src');
//            location.reload();
//            $('#image').css('height', 125);
//            document.getElementById('image').setAttribute('height', 125);
              location.reload();
//            $('#image').css('height', 125);
        }
    })
}

// Delete plot file
function deletePlot() {
    $.ajax({
        url: `/delete/`,
        type: "POST",
        processData: false,
        contentType: false
    })
}
