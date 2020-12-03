import { Block } from "prismarine-block";
import { Entity } from "prismarine-entity";
import * as mineflayer from 'mineflayer'
import { Vec3 } from 'vec3'

export function GetBlockAtNotePosition(b:mineflayer.Bot, position: number) : Block
{
    if(position > noteblockKernel.length)
    {
        return null;
    }

    let offset = noteblockKernel[position];

    console.log(offset[0]);
    let botPos = b.entity.position;
    let modX = Math.floor(botPos.x) + offset[0];
    let modY = Math.floor(botPos.y) - 2;
    let modZ = Math.floor(botPos.z) + offset[1];
    console.log("looking at " + modX + " " + modY + " " + modZ);
    let block = b.blockAt(new Vec3(modX,modY,modZ));

    return block;
}
export var noteblockKernel = [
    [-2,-4],[-1,-4],  [0,-4], [1,-4],[2,-4],
    [-3,-3],[-2,-3],[-1,-3],  [0,-3], [1,-3],[2,-3],[3,-3], 
    [-4,-2],[-3,-2],[-2,-2],[-1,-2],  [0,-2], [1,-2],[2,-2],[3,-2],[4,-2],
    [-4,-1],[-3,-1],[-2,-1],[-1,-1],  [0,-1], [1,-1],[2,-1],[3,-1],[4,-1], 
    [-4, 0],[-3, 0],[-2, 0],[-1, 0],/*[0, 0]*/[1, 0],[2, 0],[3, 0],[4, 0], 
    [-4, 1],[-3, 1],[-2, 1],[-1, 1],  [0, 1], [1, 1],[2, 1],[3, 1],[4, 1], 
    [-4, 2],[-3, 2],[-2, 2],[-1, 2],  [0, 2], [1, 2],[2, 2],[3, 2],[4, 2],
    [-3, 3],[-2, 3],[-1, 3],  [0, 3], [1, 3],[2, 3],[3, 3],
    [-2, 4],[-1, 4],  [0, 4], [1, 4],[2, 4],
];



const Constants = {
	VERSION: '2.0.13',
	NOTES: [],
	HEADER_CHUNK_LENGTH: 14,
	CIRCLE_OF_FOURTHS: ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb', 'Bbb', 'Ebb', 'Abb'],
	CIRCLE_OF_FIFTHS: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'E#']
};

// Builds notes object for reference against binary values.
const allNotes = [['C'], ['C#','Db'], ['D'], ['D#','Eb'], ['E'],['F'], ['F#','Gb'], ['G'], ['G#','Ab'], ['A'], ['A#','Bb'], ['B']];
var counter = 0;
// All available octaves.

for (let i = -1; i <= 9; i++) {
	allNotes.forEach(noteGroup => {
		noteGroup.forEach(note => Constants.NOTES[counter] = note + i);
		counter ++;
	});
}
export {Constants};


/*   -4   -3  -2  -1  00  +1  +2  +3  +4

+4           [00][01][02][03][04]
+3       [05][06][07][08][09][10][11]
+2   [12][13][14][15][16][17][18][19][20]
+1   [21][22][23][24][25][26][27][28][29]
00   [30][31][32][33][XX][34][35][36][37]
-1   [38][39][40][41][42][43][44][45][46]
-2   [47][48][49][50][51][52][53][54][55]
-3       [56][57][58][59][60][61][62]
-4           [63][64][65][66][67]

*/