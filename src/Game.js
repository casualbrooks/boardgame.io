import { INVALID_MOVE } from 'boardgame.io/core';

const GRID_WIDTH=9;
const GRID_HEIGHT=9;
const CONNECTION_MAX_DISTANCE=4;

export const TicTacToe = {
  setup: () => ({
      //create the grid
      //there is probably a better way to do this, but I couldn't figure it out so /shrug
      cells: [
        null,null,null,null,null,null,null,null,null,
        null,null,null,null,null,null,null,null,null,
        null,null,null,null,null,null,null,null,null,
        "0",null,null,null,null,null,null,null,"1",
        null,null,null,null,null,null,null,null,null,
        "0",null,null,null,null,null,null,null,"1",
        null,null,null,null,null,null,null,null,null,
        null,null,null,null,null,null,null,null,null,
        null,null,null,null,null,null,null,null,null,
      ],
      //stores the connections between different cells
      connections: [[27,45],[35,53]],
      //stores the cell the current player is selecting, if they wish to then move that cell.
      selectedcell:null,
    }),

  moves: {
    selectCell: (G, ctx, id) => { //I'm sorry for this "move".  The documentation on stages, which is what I thought I should use, was confusing.  Instead, I wrote this monstrosity.
      if(G.cells[id]==null){
        if(G.selectedcell==null){
          let newConnections=getAdjacentFriendlyCells(id,ctx.currentPlayer,G.cells);
          if(newConnections.length==0){
            //cannot create cell if there is no nearby friendly cell
            return INVALID_MOVE;
          }else{
            //create new connections between cell and adjacent cells
            var i=0;
            while(i<newConnections.length){
              G.connections.push([id,newConnections[i]]);
              i++;
            }
            //Set the new cell as owned by the current player
            G.cells[id]=ctx.currentPlayer;
            ctx.events.endTurn();
          }
        }else{
          //move the cell to the new position
          if(!isMoveConnectionsValid(G.selectedcell,id,G.connections)){
            return INVALID_MOVE;
          }
          G.cells[id]=G.cells[G.selectedcell];
          G.cells[G.selectedcell]=null;
          updateConnections(G,G.selectedcell,id)
          G.selectedcell=null;
          ctx.events.endTurn();
        }
      }else{
        if(G.cells[id]==ctx.currentPlayer){//select the cell to attempt to move it
          if(G.selectedcell==id){
            G.selectedcell=null;
          }else{
            G.selectedcell=id;
          }
        }else if(G.selectedcell!=null){ //capture cell
          if(cellsAreAdjacent(G.selectedcell,id)&&G.cells[id]!=G.cells[G.selectedcell]){ //make sure attempting to capture adjacent enemy cell
            if(!isMoveConnectionsValid(G.selectedcell,id,G.connections)){ //make sure we're not moving too far from our connections
              return INVALID_MOVE;
            }
            let selectedconnections=0;
            let targetconnections=0;
            var i=0;
            while(i<G.connections.length){ //count the number of connections for each cell
              if(G.connections[i][0]==G.selectedcell||G.connections[i][1]==G.selectedcell){
                selectedconnections++;
              }
              if(G.connections[i][0]==id||G.connections[i][1]==id){
                targetconnections++;
              }
              i++;
            }
            if(selectedconnections==targetconnections){ //cells annihilate each other if they have the same number of connections
              G.cells[id]=null;
              G.cells[G.selectedcell]=null;
              deleteConnections(G,id);
              deleteConnections(G,G.selectedcell);
              G.selectedcell=null;
            }else if(selectedconnections>targetconnections){ //the cell moves to the captured position if it has more connections
              deleteConnections(G,id);
              updateConnections(G,G.selectedcell,id)
              G.cells[id]=G.cells[G.selectedcell];
              G.cells[G.selectedcell]=null;
              G.selectedcell=null;
            }else{
              return INVALID_MOVE; //can't attempt to capture if you're sure to fail!
            }
          }else{
            return INVALID_MOVE
          }
        }else{
          //You can only select one of your own pieces to move
          return INVALID_MOVE;
        }
      }
    },
  },

  endIf: (G, ctx) => {
    if (IsVictory(G.cells)) {
      return { winner: ctx.currentPlayer };
    }
    if (IsDraw(G.cells)) {
      return { draw: true };
    }
  },

};

function deleteConnections(G,cell){
  var i=0;
  while(i<G.connections.length){
    if(G.connections[i][0]==cell||G.connections[i][1]==cell){
      G.connections.splice(i,1);
    }else{
      i++;
    }
  }
}

function deleteUnconnectedNodes(G){
  var i=0;
  while(i<G.cells.length){
    if(G.cells[i]!=null){
      var count=0;
      var j=0;
      while(j<G.connections.length){
        if(G.connections[j][0]==i||G.connections[j][1]==i){
          count++;
        }
        j++;
      }
      if(count==0){
        G.cells[i]=null;
      }
    }
    i++;
  }
}

function updateConnections(G,prevlocation,newlocation){
  var i=0;
  while(i<G.connections.length){
    //change any connections involving the moved cell
    if(G.connections[i][0]==prevlocation){
      G.connections[i][0]=newlocation;
    }
    if(G.connections[i][1]==prevlocation){
      G.connections[i][1]=newlocation;
    }
    i++;
  }
}

function isMoveConnectionsValid(prevposition,targetposition,connections){
  var i=0;
  var valid=true;
  while(i<connections.length){
    if(connections[i][0]==prevposition){
      if(!connectionValidLength(targetposition,connections[i][1])){
        valid=false;
      }
    }
    if(connections[i][1]==prevposition){
      if(!connectionValidLength(targetposition,connections[i][0])){
        valid=false;
      }
    }
    i++;
  }
  return valid;
}

function connectionValidLength(position1,position2){
  var node1={x:position1%GRID_WIDTH,y:Math.floor(position1/GRID_HEIGHT)};
  var node2={x:position2%GRID_WIDTH,y:Math.floor(position2/GRID_HEIGHT)};
  if(Math.sqrt(Math.pow(node1.x-node2.x,2)+Math.pow(node1.y-node2.y,2))<=CONNECTION_MAX_DISTANCE){//Good 'ol pythagoras
    return true;
  }else{
    return false;
  }
}

function getAdjacentFriendlyCells(position,player,cells){
  let hpos=position%GRID_WIDTH;
  let vpos=Math.floor(position/GRID_HEIGHT);
  var ret=[];
  //Check Left
  if(hpos>0&&cells[position-1]==player){
    ret.push(position-1);
  }
  //Check Right
  if(hpos<8&&cells[position+1]==player){
    ret.push(position+1);
  }
  //Check Up
  if(vpos>0&&cells[position-GRID_WIDTH]==player){
    ret.push(position-GRID_WIDTH);
  }
  //Check Down
  if(vpos<8&&cells[position+GRID_WIDTH]==player){
    ret.push(position+GRID_WIDTH);
  }
  return  ret
}

function cellsAreAdjacent(position1,position2){
  return  position1+GRID_WIDTH==position2||
          position1-GRID_WIDTH==position2||
          (position1%9>0&&position1-1==position2)||
          (position1%9<8&&position1+1==position2)
}

function IsVictory(cells) {
  var i=0;
  while(i<cells.length){

    i++;
  }
  return false;
}


function IsDraw(cells) {
  return cells.filter(c => c === null).length === 0;
}
