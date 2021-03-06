"use strict";

function topo_sorted_slugs() {
    if (document.univ_courses_sorted) {
        return document.univ_courses_sorted;
    }

    // build a list of all edges in the graph
    var edges = []
    for (var course_idx in document.univ_courses) {
        var course = document.univ_courses[course_idx];
        for (var p_idx in course.prerequisites) {
            edges.push([course.slug, course.prerequisites[p_idx].slug]);
        }
    }
    // tsort from file assets/toposort.js
    var sorted = tsort(edges);
    sorted.reverse();
    document.univ_courses_sorted = sorted;
    return sorted;
}

function recursive_prerequisties(course) {
    // find all recursive prerequisites, in any order:
    var all_prereqs = [];
    var seen = {};
    function visit(prereqs) {
        for (var idx in prereqs) {
            var p = document.univ_courses[prereqs[idx].slug];
            if (!seen[p.slug]) {
                all_prereqs.push(p);
                visit(p.prerequisites);
                seen[p.slug] = 1;
            }
        }
    }
    visit(course.prerequisites);

    // now join it with the topological sorted list of all
    // course slugs to get the ordering sensible:
    var r_obj = {}
    all_prereqs.forEach(function(r) {
        r_obj[r.slug] = r;
    });
    var sorted_prereqs = [];
    topo_sorted_slugs().forEach(function (r) {
        if (r_obj.hasOwnProperty(r)) {
            sorted_prereqs.push(r_obj[r]);
        }
    });

    return sorted_prereqs;
}

function fill_ul($ul, prereq) {
    $ul.html('');
    for (var idx in prereq) {
        var $a = $('<a>', {
            text: (prereq[idx].name || prereq[idx].course),
            href: '#',
            data: {'slug': prereq[idx].slug},
            click: show_details,
        });
        var $li = $('<li>').html($a);
        $ul.append($li)
    }
}

function show_details() {
    var slug   = $(this).data('slug');
    var course = document.univ_courses[slug];
    var $cont  = $('#course_details');
    $cont.find('#course_details_name').text(course.course);
    $cont.find('#course_details_level').text(course.level);
    $cont.find('#course_details_duration').text(course.duration);
    $cont.find('#course_details_cost').text(course.cost);

    var universities = {
        tau: 'Tau Station (Sol)',
        nl:  'Nouveau Limoges (Sol)',
        moi: 'Moissan (Alpha Centauri)',
        sob: 'Spirit of Botswana (Alpha Centauri)',
    };

    var avail = [];
    var keys = Object.keys(universities);
    keys.sort();
    for (var idx in keys) {
        if (course[keys[idx]]) {
            avail.push(universities[keys[idx]]);
        }
    }
    $cont.find('#course_details_universities').text(avail.join(', '));

    function debug($x) {
        console.log($x.wrap('<div>').parent().html());
        $x.unwrap();
    }

    if (course.prerequisites) {
        $cont.find('#course_details_prerequisites_cont').show();
        var rp = recursive_prerequisties(course);
        fill_ul($('#course_details_all_prerequisites'), rp);
    }
    else {
        $cont.find('#course_details_prerequisites_cont').hide();
    }

    $('.course_details_close').click(function() {
        $cont.hide();
        return false;
    });
    
    $cont.show();
    return false;
}

$(document).ready(function() {
    $('#univ').dynatable({
        table: {
            defaultColumnIdStyle: 'dashed',
        },
        features: {
            paginate: false
        },
        dataset: {
            perPageDefault: 200,
            sortTypes: {
                'level': 'number',
                'duration': 'number',
                'cost': 'number'
            }
        }
    });
    $('.course-link').click(show_details);
    $(document).keyup(function(e) {
        if (e.keyCode == 27) {
            // ESCape key pressed => hide popup
            $('#course_details').hide();
        }
    });
});
