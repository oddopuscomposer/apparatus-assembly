import ApparatusGenerator from 'apparatus-generator';
import * as ut from './utils';

const sketch = p => {
  let app_gen;
  let apparatus;
  let scale = 6;
  let shuffle = 200;
  let tick = 0;
  let final_frame_duration = 25;
  let symmetric_assembly = true;
  let movement_length = 0.8;

  p.setup = () => {
    p.createCanvas(800, 800);
    p.background('#fffbd6');
    p.fill(0);
    p.frameRate(30);
    p.strokeWeight(3);
    p.stroke('#5e1a13');
    //p.noStroke();
    app_gen = new ApparatusGenerator(26, 36, {
      solidness: 0.5,
      initiate_chance: 0.9,
      extension_chance: 0.86,
      vertical_chance: 0.5,
      roundness: 0,
      group_size: 0.82,
      colors: ['#bf5c32', '#efad57', '#69766f', '#f7e5cc', '#936454', '#9ed6cb', '#9d8f7f']
    });

    setup_apparatus();
  };

  function setup_apparatus() {
    symmetric_assembly = true;
    apparatus = app_gen.generate();
    populate_apparatus(apparatus);
    let number_of_directions = symmetric_assembly ? 3 : 4;
    let chosen = apparatus[p.floor(p.random(apparatus.length))];
    let origin = symmetric_assembly ? get_with_id(apparatus, chosen.id) : [chosen];
    let direction = random_dir(number_of_directions);

    for (let i = final_frame_duration; i < shuffle; i++) {
      if (i === shuffle / 2) symmetric_assembly = false;

      number_of_directions = symmetric_assembly ? 3 : 4;
      apparatus.forEach(part => {
        part.path.push({ x: part.x1, y: part.y1 });
      });
      let keep_moving = p.random() < movement_length;
      if (!keep_moving) {
        chosen = apparatus[p.floor(p.random(apparatus.length))];
        origin = symmetric_assembly ? get_with_id(apparatus, chosen.id) : [chosen];
        direction = symmetric_assembly && origin.length === 1 ? random_dir(2) : random_dir(number_of_directions);
      }
      if (symmetric_assembly) {
        let pair = get_with_id(apparatus, chosen.id);

        if (direction === mirror(direction)) {
          let neighborhood = get_neighborhood(pair, apparatus, direction);
          shift_all(neighborhood, direction, i);
        } else if (pair.length !== 1) {
          let neighborhood_left = get_neighborhood([pair[0]], apparatus, mirror(direction));
          let neighborhood_right = get_neighborhood([pair[1]], apparatus, direction);
          shift_all(neighborhood_left, mirror(direction), i);
          shift_all(neighborhood_right, direction, i);
        }
      } else {
        let neighborhood = get_neighborhood([chosen], apparatus, direction);
        shift_all(neighborhood, direction, i);
      }
    }
  }

  function populate_apparatus(app) {
    app.forEach(part => {
      part.x2 = part.x1 + part.w;
      part.y2 = part.y1 + part.h;
      part.path = [];
      for (let i = 0; i < final_frame_duration; i++) {
        part.path.push({ x: part.x1, y: part.y1 });
      }
    });
  }

  p.draw = () => {
    p.background('#fffbd6');
    p.translate((p.width - (app_gen.xdim + 2) * scale) / 2, (p.height - (app_gen.ydim + 2) * scale) / 2);

    if (tick >= shuffle) {
      setup_apparatus();
      tick = 0;
    }
    apparatus.forEach(part => {
      display_rect(part, scale, shuffle - tick - 1);
    });
    tick++;
  };

  function get_neighborhood(ps, rs, dir) {
    let ns = ps;
    let ms = ut.union(ns, ut.flatten(ns.map(n => get_neighbors(n, rs, dir)), equals), equals);

    while (ms.length > ns.length) {
      ns = ms;
      ms = ut.union(ns, ut.flatten(ns.map(n => get_neighbors(n, rs, dir)), equals), equals);
    }
    return ms;
  }

  function get_neighbors(r1, rs, dir) {
    return rs.filter(r => is_neighbor(r1, r, dir));
  }

  function is_neighbor(r1, r2, dir) {
    if (equals(r1, r2)) return false; // Identical
    if (dir == 0) return r2.y2 == r1.y1 && r2.x1 < r1.x2 && r2.x2 > r1.x1; // North
    if (dir == 1) return r2.x1 == r1.x2 && r2.y1 < r1.y2 && r2.y2 > r1.y1; // East
    if (dir == 2) return r2.y1 == r1.y2 && r2.x1 < r1.x2 && r2.x2 > r1.x1; // South
    if (dir == 3) return r2.x2 == r1.x1 && r2.y1 < r1.y2 && r2.y2 > r1.y1; // West
    return false; // Error
  }

  function equals(r1, r2) {
    return r1.x1 == r2.x1 && r1.y1 == r2.y1 && r1.x2 == r2.x2 && r1.y2 == r2.y2;
  }

  function shift_all(rs, dir, time) {
    rs.forEach(r => shift(r, dir, time));
  }

  function shift(r, dir, time) {
    let sx = dir % 2 == 0 ? 0 : dir == 1 ? 1 : -1;
    let sy = dir % 2 == 0 ? (dir == 2 ? 1 : -1) : 0;

    r.x1 += sx;
    r.y1 += sy;
    r.x2 += sx;
    r.y2 += sy;
    r.path[time] = { x: r.x1, y: r.y1 };
  }

  function random_dir(n) {
    if (n === 2) return p.random() > 0.5 ? 0 : 2; // Up or down (50/50)
    if (n === 3) return p.random() > 0.5 ? 1 : p.random() > 0.5 ? 2 : 0; // Up, right or down (25/50/25)
    return p.floor(p.random(n)); // Up, right, down or left (25/25/25/25)
  }

  function mirror(dir) {
    if (dir == 0 || dir == 2) return dir;
    if (dir == 1) return 3;
    if (dir == 3) return 1;
  }

  function get_with_id(rs, id) {
    return rs.filter(r => r.id === id);
  }

  function display_rect(r, scale, time) {
    p.fill(r.col ? r.col : '#fff');
    p.rect(r.path[time].x * scale, r.path[time].y * scale, r.w * scale, r.h * scale);
  }

  p.keyPressed = () => {
    if (p.keyCode === 83) symmetric_assembly = !symmetric_assembly;
    else if (p.keyCode === 80) p.saveCanvas('apparatus_assembly', 'png');
  };
};

new p5(sketch);
