/**
 * Created by marius on 20/02/15.
 */


function openModal (src) {
    $.modal('<iframe src="' + src + '" height="480" width="800" style="border:0">', {
        closeHTML: "",
        containerCss: {
            backgroundColor: "#fff",
            borderColor: "#fff",
            height: 500,
            padding: 0,
            width: 820
        },
        overlayClose: true
    });
}
