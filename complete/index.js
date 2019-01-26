const { getFilesName, readFile, getFileName } = require('./fileSystem');
const { readLine } = require('./console');

app();

function app() {
   console.log('Please, write your command!');
   readLine(processCommand);
}

async function getFiles() {
   const result = await getFilesName(process.cwd(), 'js');
   return new Promise(resolve => {
      let promiseArr = [];
      result.forEach(val => {
         promiseArr.push(new Promise(resolve => {
            readFile(val).then(res => {
               resolve({ "file": val, "text": res });
            });
         }));
      });
      Promise.all(promiseArr).then(fileArr => {
         resolve(fileArr);
      });
   });
}

//return array of objects with fields (obj.!, .user, .date., .comments, .file)
async function getComments() {
   const result = await getFiles();
   let commentsFromFiles = result.map(val => {
      let pattern = `${"//"} ${"todo"}`;
      return {
         "file": val.file,
         "commentsArr": val.text.split('\n').filter(val => {
            if (~val.toLowerCase().indexOf(pattern))
               return 1;
         }).map(val => { return val.substr(val.toLowerCase().indexOf(pattern)); })
      };
   });
   let commentsObjectsArray = [];
   commentsFromFiles.forEach(val => {
      val.commentsArr.forEach(dirtComment => {
         let markup = (dirtComment.split(";").length < 3) ? false : dirtComment.split(";");
         let obj = {
            "!": (~dirtComment.indexOf("!")) ? true : false,
            "user": markup ? markup[0].slice(7).trim() : "",
            "date": markup ? markup[1].trim() : "",
            "comment": markup ? markup[2].trim() : dirtComment.slice(7).trim(),
            "fileName": val.file
         };
         let i = 0, pos = 0;
         while (~(pos = dirtComment.indexOf("!", pos + 1))) {
            i += 1;
         }
         Object.defineProperty(obj, "importanceLevel", {
            enumerable: false,
            value: i
         });
         commentsObjectsArray.push(obj);
      });
   });
   return commentsObjectsArray;
}

function renderTable(commentsArr) {
   function getWith(prop, max) {
      let currentWith = prop.length;
      commentsArr.forEach(val => {
         currentWith = (currentWith < val[prop].length) ? val[prop].length : currentWith;
         if (val[prop].length >= max) {
            currentWith = max;
            return;
         }
      });
      return currentWith;
   }

   let tableWidth = {
      "!": 1,
      "user": getWith("user", 10),
      "date": getWith("date", 10),
      "comment": getWith("comment", 50),
      "fileName": getWith("fileName", 15)
   };

   let padding = ` `.repeat(2);
   function drawTh() {
      function td(n) {
         return `${padding + n + ` `.repeat(tableWidth[n] - n.length) + padding}`;
      }
      let header = `${td("!")}|${td("user")}|${td("date")}|${td("comment")}|${td("fileName")}`;
      return header + `\n` + `${`-`.repeat(header.length)}`;
   }

   function drawTr(obj) {
      function tr(prop) {
         if (prop == "!") return (obj[prop]) ? `${padding + "!" + padding}` : `${padding} ${padding}`;
         if (obj[prop].length == tableWidth[prop]) return `${padding + obj[prop] + padding}`;
         if (obj[prop].length > tableWidth[prop]) return `${padding + obj[prop].slice(0, tableWidth[prop] - 3) + "..." + padding}`;
         if (obj[prop].length < tableWidth[prop]) return `${padding + obj[prop] + ` `.repeat(tableWidth[prop] - obj[prop].length) + padding}`;
      }
      return `${tr("!")}|${tr("user")}|${tr("date")}|${tr("comment")}|${tr("fileName")}`;
   }

   let renderStr = drawTh();
   renderStr += "\n";
   commentsArr.forEach((val) => {
      renderStr += drawTr(val) + "\n";
   });

   if (commentsArr.length == 0) { return renderStr; }
   renderStr += `-`.repeat(renderStr.indexOf("\n"));

   //render full table
   console.log(renderStr);

}

function commentSort(objArr, condition) {
   switch (condition) {
      case "importance":
         objArr.sort((a, b) => {
            return (a.importanceLevel > b.importanceLevel) ? -1 : (a.importanceLevel < b.importanceLevel) ? 1 : 0;
         });
         return objArr;

      case "user":
         let emptyGroup = [];
         let userGroup = [];
         objArr.forEach((val, i) => {
            if (!val.user.trim().length) emptyGroup.push(objArr[i]);
            else userGroup.push(objArr[i]);
         });

         let groups = new Map();
         userGroup.forEach((val, i) => {
            let currentUser = [];
            userGroup.forEach((find, i) => {
               if (val.user.toLowerCase() == find.user.toLowerCase()) {
                  currentUser.push(userGroup[i]);
               }
            });
            groups.set(val.user.toLowerCase(), currentUser);
         });

         //in group sorting (pe, PE, pe) => (PE, pe, pe)
         let inGroupSorted = new Map();
         groups.forEach((val) => {
            let currentGroup = [];
            val.forEach((obj) => {
               currentGroup.push(obj);
            });
            currentGroup.sort((a, b) => {
               return (a.user > b.user) ? -1 : (a.user < b.user) ? 1 : 0;
            });
            inGroupSorted.set(currentGroup[0].user.toLowerCase(), currentGroup);
         });

         //group index sorting (digi, pe, name123) => (pe, digi, name123)
         let sortedKeys = [...inGroupSorted.keys()].sort((a, b) => {
            return (a.length > b.length) ? 1 : (a.length < b.length) ? -1 : 0;
         });
         let sortedGroups = new Map();
         sortedKeys.forEach((val) => {
            sortedGroups.set(val, inGroupSorted.get(val));
         });

         objArr = [];
         [...sortedGroups.values()].forEach((val) => {
            val.forEach((obj) => {
               objArr.push(obj);
            });
         });
         return objArr.concat(emptyGroup);

      case "date":
         let withDate = [];
         let withoutDate = [];
         objArr.forEach((val) => {
            if (val.date.trim().length == 0) {
               withoutDate.push(val);
            } else {
               withDate.push(val);
            }
         });
         withDate.sort((a, b) => {
            return (new Date(a.date) > new Date(b.date)) ? -1 : (new Date(a.date) < new Date(b.date)) ? 1 : 0;
         });
         return withDate.concat(withoutDate);

      default:
         console.log('wrong command');
         return -1;
   }
}

function processCommand(command) {
   command = command.split(" ");
   switch (command[0]) {
      case 'exit':
         process.exit(0);
         break;

      case 'show':
         if (command.length > 1) { console.log('wrong command'); break; }
         getComments().then(comments => {
            renderTable(comments);
         });
         break;

      case 'important':
         if (command.length > 1) { console.log('wrong command'); break; }
         getComments().then(comments => {
            let importantTable = [];
            comments.forEach((val) => {
               if (val["!"]) importantTable.push(val);
            });
            renderTable(importantTable);
         });
         break;

      case 'user':
         if (command.length == 1 || command.length > 2) { console.log('wrong command'); break; }
         getComments().then(comments => {
            let userTable = [];
            comments.forEach(val => {
               if (val.user.toLowerCase().slice(0, command[1].length) == command[1]) userTable.push(val);
            });
            renderTable(userTable);
         });
         break;

      case 'sort':
         if (command.length == 1 || command.length > 2) { console.log('wrong command'); break; }
         getComments().then(comments => {
            let sortedTable = commentSort(comments, command[1]);
            if (sortedTable == -1) return;
            renderTable(sortedTable);
         });
         break;

      case 'date':
         if (command.length == 1 || command.length > 2) { console.log('wrong command'); break; }
         getComments().then(comments => {
            let dateTable = [];
            comments.forEach(val => {
               if (command[1] <= val.date) dateTable.push(val);
            });
            dateTable.sort((a, b) => {
               return (new Date(a.date) >= new Date(b.date)) ? 1 : -1;
            });
            renderTable(dateTable);
         });
         break;

      default:
         console.log('wrong command');
         break;
   }
}

// TODO you can do it!
