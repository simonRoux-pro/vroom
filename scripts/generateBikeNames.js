const fs = require('fs');
const https = require('https');

// Grande liste de prénoms internationaux (au moins 500, hommes et femmes, toutes origines)
const prenoms = [
  'Liam','Noah','Oliver','Elijah','James','William','Benjamin','Lucas','Henry','Theodore',
  'Jack','Levi','Alexander','Jackson','Mateo','Daniel','Michael','Mason','Sebastian','Ethan',
  'Logan','Owen','Samuel','Jacob','Asher','Aiden','John','Joseph','Wyatt','David',
  'Leo','Luke','Julian','Hudson','Grayson','Matthew','Ezra','Gabriel','Carter','Isaac',
  'Jayden','Luca','Anthony','Dylan','Lincoln','Thomas','Maverick','Elias','Josiah','Charles',
  'Caleb','Christopher','Ezekiel','Miles','Jaxon','Isaiah','Andrew','Joshua','Nathan','Nolan',
  'Adrian','Cameron','Santiago','Eli','Aaron','Ryan','Angel','Cooper','Waylon','Easton',
  'Kai','Christian','Landon','Colton','Roman','Axel','Brooks','Jonathan','Robert','Jameson',
  'Ian','Everett','Greyson','Wesley','Jeremiah','Hunter','Leonardo','Jordan','Jose','Bennett',
  'Silas','Nicholas','Parker','Beau','Weston','Austin','Connor','Carson','Dominic','Xavier',
  'Jace','Jaxson','Emmett','Adam','Declan','Rowan','Micah','Kayden','Gael','River',
  'Ryder','Kingston','Damian','Sawyer','Luka','Evan','Vincent','Legend','Mylo','Harrison',
  'August','Bryson','Amir','Giovanni','Chase','Diego','Milo','Jasper','Walker','Jason',
  'Brayden','Cole','Nathaniel','George','Lorenzo','Zion','Luis','Archer','Enzo','Jonah',
  'Thiago','Theo','Ayden','Zachary','Calvin','Braxton','Ashton','Rhett','Atlas','Jude',
  'Bentley','Carlos','Ryker','Adriel','Arthur','Ace','Tyler','Jayce','Max','Elliot',
  'Graham','Kaiden','Maxwell','Juan','Dean','Matteo','Malachi','Ivan','Elliott','Jesus',
  'Emiliano','Messiah','Gavin','Maddox','Camden','Hayden','Leon','Antonio','Justin','Tucker',
  'Brandon','Kevin','Judah','Finn','King','Brody','Xander','Nicolas','Charlie','Arlo',
  'Emmanuel','Barrett','Felix','Alex','Miguel','Abel','Alan','Beckett','Amari','Karter',
  'Timothy','Abraham','Jesse','Zayden','Blake','Alejandro','Dawson','Tristan','Victor','Avery',
  'Joel','Grant','Eric','Patrick','Peter','Richard','Edward','Andres','Emilio','Colt',
  'Knox','Beckham','Adonis','Kyrie','Matias','Oscar','Lukas','Marcus','Hayes','Caden',
  'Remington','Griffin','Nash','Israel','Steven','Simon','Sullivan','Jose','Zane','Jett',
  'Brooks','Cash','Daxton','Cody','Kaden','Preston','Kyler','Jaden','Maddox','Paul',
  'Omar','Brian','Joaquin','Kenneth','Ali','Aidan','Phoenix','Javier','Milo','Maximus',
  'Malakai','Gideon','George','Brady','Jaylen','Malcolm','Jensen','Finley','Ronan','Andre',
  'Jake','Kash','Callum','Spencer','Stephen','Francisco','Shane','Erick','Prince','Kameron',
  'Orion','Martin','Julius','Cristian','Fernando','Cesar','Dallas','Rory','Gage','Raiden',
  'Ricardo','Chance','Edwin','Tobias','Manuel','Colin','Ruben','Frank','Troy','Clark',
  'Andy','Jay','Pedro','Grant','Emerson','Derek','Jared','Rafael','Cohen','Zayn',
  'Hector','Ali','Atticus','Dante','Jorge','Ali','Marco','Edgar','Johnny','Damon',
  'Jesse','Travis','Bodhi','Abel','Zander','Erik','Corbin','Khalil','Fabian','Iker',
  'Sergio','Gunnar','Joaquin','Sage','Ezequiel','Marshall','Dennis','Saul','Donald','Bruce',
  'Kian','Mohamed','Pierce','Alec','Ari','Enrique','Jayson','Kaison','Kellan','Moses',
  'Aarav','Braylen','Jasiah','Ronin','Santino','Kaysen','Luciano','Tatum','Cannon','Kaison',
  'Dorian','Dax','Koa','Kylan','Kaison','Kaison','Kaison','Kaison','Kaison','Kaison',
  // Ajout de prénoms féminins et internationaux
  'Emma','Olivia','Ava','Isabella','Sophia','Charlotte','Amelia','Mia','Harper','Evelyn',
  'Abigail','Ella','Elizabeth','Camila','Luna','Sofia','Avery','Mila','Aria','Scarlett',
  'Penelope','Layla','Chloe','Victoria','Madison','Eleanor','Grace','Nora','Riley','Zoey',
  'Hannah','Hazel','Lily','Ellie','Violet','Lillian','Zoe','Stella','Aurora','Natalie',
  'Emilia','Everly','Leah','Aubrey','Willow','Addison','Lucy','Audrey','Bella','Nova',
  'Brooklyn','Paisley','Savannah','Claire','Skylar','Isla','Genesis','Naomi','Elena','Caroline',
  'Eliana','Anna','Maya','Valentina','Ruby','Kennedy','Ivy','Ariana','Aaliyah','Cora',
  'Madelyn','Alice','Kinsley','Hailey','Gabriella','Allison','Gianna','Serenity','Samantha','Sarah',
  'Autumn','Quinn','Eva','Piper','Sophie','Sadie','Delilah','Josephine','Nevaeh','Adeline',
  'Arya','Emery','Lydia','Clara','Vivian','Madeline','Peyton','Julia','Rylee','Brielle',
  'Reagan','Natalia','Jade','Athena','Maria','Leilani','Everleigh','Liliana','Melanie','Mackenzie',
  'Hadley','Raelynn','Kaylee','Rose','Arianna','Isabelle','Melody','Eliza','Lyla','Katherine',
  'Aubree','Adalynn','Kylie','Faith','Alexandra','Mary','Margaret','Ximena','Jasmine','Charlie',
  'Amaya','Taylor','Isabel','Ashley','Khloe','Ryleigh','Alexa','Amara','Valeria','Andrea',
  'Parker','Norah','Eden','Elliana','Brianna','Emersyn','Valerie','Anastasia','Hayden','Raegan',
  'Camille','Kayla','Teagan','Alaina','Brynlee','Finley','Catalina','Sloane','Jordyn','Aliyah',
  'Juliana','Sydney','Harmony','Adalyn','Gemma','June','Maisie','Remi','Georgia','Sawyer',
  'Lila','Callie','Juliette','Sage','Ada','Lilliana','Millie','Ruth','Delaney','Dakota',
  'Blakely','Ember','Brooke','Lola','Malia','Alyssa','Jane','Journey','Alana','Jocelyn',
  'Morgan','London','Kimberly','Tessa','Angelina','Adelyn','Rebecca','Alivia','Michelle','Presley',
  'Nicole','Rowan','Payton','Marley','Amina','Mariah','Zara','Leila','Alayna','Sara',
  'Rosemary','Emmy','Cecilia','Kamila','Hope','Annie','Alexis','Gracie','Lucia','Makayla',
  'Briella','Izabella','Logan','Lena','Adriana','Vivienne','Ariella','Ayla','Elise','Alexandria',
  'Diana','Dakota','Esther','Raelyn','Ariel','Selena','Maggie','Alina','Winter','Sutton',
  'Sienna','Kehlani','Carmen','Veronica','Heidi','Alani','Phoenix','Jada','Miriam','Nina',
  'Sabrina','Sage','Sarai','Dahlia','Mya','Leia','Madilyn','Kali','Celeste','Mckenna',
  'Haven','Cheyenne','Kira','Nyla','Maci','Maddison','Elianna','Alicia','Kaitlyn','Miranda',
  'Angel','Danielle','Cameron','Kendra','Daniella','Hayley','Fiona','Phoebe','Holly','Selah',
  'Julianna','Mallory','Kamryn','Sylvia','Janelle','Mira','Jemma','Jazlyn','Jillian','Ainsley',
  'Kelsey','Fatima','Talia','Nadia','Cassandra','Myla','Adelaide','Nayeli','Serena','Viviana',
  'Francesca','Amira','Arielle','Megan','Carly','Jessica','Tatum','Alessandra','Evangeline','Joanna',
  'Demi','Makenna','Evelynn','Ophelia','Matilda','Kiara','Cataleya','Anaya','Kali','Sierra',
  'Raelyn','Kara','Aitana','Kaliyah','Kassidy','Kora','Lennon','Mara','Mariam','Mina',
  'Monroe','Naya','Noa','Paige','Paloma','Pearl','Penny','Poppy','Raya','Reina',
  'Renata','Rhea','Rory','Rosalie','Rosie','Royal','Rylie','Sasha','Scarlet','Selene',
  'Shiloh','Skyler','Sloan','Sonia','Stevie','Tiana','Tiffany','Vera','Willa','Zaria'
];

const url = 'https://api.saint-etienne-metropole.fr/velivert/api/free_bike_status.json';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const bikes = json.data && json.data.bikes ? json.data.bikes : [];
      const ids = bikes.map(b => b.bike_id);
      const mapping = {};
      ids.forEach((id, i) => {
        let prenom = prenoms[i] || `Name${i+1}`;
        mapping[id] = prenom;
      });
      fs.writeFileSync('bikeNames.json', JSON.stringify(mapping, null, 2), 'utf-8');
      console.log(`Généré : ${ids.length} vélos, mapping dans bikeNames.json`);
    } catch (e) {
      console.error('Erreur de parsing ou d’écriture :', e);
    }
  });
}).on('error', (e) => {
  console.error('Erreur de requête :', e);
}); 